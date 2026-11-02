CREATE TABLE public.boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('listing', 'ad', 'store')),
  target_id TEXT NOT NULL,
  reach_percent INTEGER NOT NULL CHECK (reach_percent BETWEEN 10 AND 100),
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  location_id TEXT REFERENCES public.marketplace_locations(id),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  end_reason TEXT CHECK (end_reason IN ('expired', 'target_unavailable')),
  impressions BIGINT NOT NULL DEFAULT 0 CHECK (impressions >= 0),
  clicks BIGINT NOT NULL DEFAULT 0 CHECK (clicks >= 0),
  notification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX boosts_active_target_idx
  ON public.boosts (target_type, target_id, starts_at, ends_at)
  WHERE status = 'active';
CREATE INDEX boosts_admin_recent_idx ON public.boosts (created_at DESC);
CREATE UNIQUE INDEX boosts_one_active_per_target_idx
  ON public.boosts (target_type, target_id)
  WHERE status = 'active';

ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.boosts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.boosts TO service_role;

CREATE TABLE public.boost_daily_events (
  target_type TEXT NOT NULL CHECK (target_type IN ('listing', 'ad', 'store')),
  target_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'click')),
  event_day DATE NOT NULL,
  viewer_fingerprint TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (target_type, target_id, event_type, event_day, viewer_fingerprint)
);
CREATE INDEX boost_daily_events_expiry_idx ON public.boost_daily_events (event_day);

ALTER TABLE public.boost_daily_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.boost_daily_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.boost_daily_events TO service_role;

CREATE OR REPLACE FUNCTION public.boost_audience_bucket(p_key TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  result BIGINT := 0;
  position INTEGER;
BEGIN
  FOR position IN 1..char_length(p_key) LOOP
    result := mod(result * 31 + ascii(substr(p_key, position, 1)), 4294967296);
  END LOOP;
  RETURN mod(result, 100)::INTEGER;
END;
$$;

CREATE OR REPLACE FUNCTION public.boost_target_is_eligible(
  p_target_type TEXT,
  p_target_id TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_target_type = 'listing' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id::TEXT = p_target_id
        AND l.moderation_status = 'approved'
        AND lower(COALESCE(l.status, 'available')) IN ('active', 'available')
        AND NOT public.listing_is_expired(l)
        AND (
          l.store_id IS NULL OR EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = l.store_id AND s.status = 'approved' AND s.archived_at IS NULL
          )
        )
    );
  ELSIF p_target_type = 'ad' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.store_ads a
      JOIN public.stores s ON s.id = a.store_id
      WHERE a.id = p_target_id
        AND a.moderation_status = 'approved'
        AND a.status = 'Active'
        AND s.status = 'approved'
        AND s.archived_at IS NULL
        AND (
          NULLIF(a.ad_data ->> 'startDate', '') IS NULL
          OR (
            a.ad_data ->> 'startDate' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            AND a.ad_data ->> 'startDate' <= to_char(CURRENT_DATE, 'YYYY-MM-DD')
          )
        )
        AND (
          COALESCE(a.ad_data ->> 'scheduleType', 'continuous') <> 'end_date'
          OR (
            a.ad_data ->> 'endDate' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
            AND a.ad_data ->> 'endDate' >= to_char(CURRENT_DATE, 'YYYY-MM-DD')
          )
        )
    );
  ELSIF p_target_type = 'store' THEN
    RETURN EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id::TEXT = p_target_id
        AND s.status = 'approved'
        AND s.archived_at IS NULL
    );
  END IF;
  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.boost_target_is_eligible(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.boost_target_is_eligible(TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.get_active_visibility_boosts()
RETURNS TABLE (
  id UUID,
  target_type TEXT,
  target_id TEXT,
  reach_percent INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  location_id TEXT,
  status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT b.id, b.target_type, b.target_id, b.reach_percent,
    b.starts_at, b.ends_at, b.location_id, b.status
  FROM public.boosts b
  WHERE b.status = 'active'
    AND b.starts_at <= NOW()
    AND b.ends_at > NOW()
    AND public.boost_target_is_eligible(b.target_type, b.target_id)
$$;

REVOKE ALL ON FUNCTION public.get_active_visibility_boosts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_visibility_boosts() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_visibility_boost(
  p_target_type TEXT,
  p_target_id TEXT,
  p_reach_percent INTEGER,
  p_duration_hours INTEGER,
  p_location_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_id UUID := (SELECT auth.uid());
  owner_id UUID;
  created_boost_id UUID;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to boost an item';
  END IF;
  IF p_target_type IS NULL OR p_target_type NOT IN ('listing', 'ad', 'store') THEN
    RAISE EXCEPTION 'Unsupported boost target';
  END IF;
  IF p_reach_percent IS NULL OR p_reach_percent NOT BETWEEN 10 AND 100 THEN
    RAISE EXCEPTION 'Reach must be between 10 and 100 percent';
  END IF;
  IF p_duration_hours IS NULL OR p_duration_hours NOT BETWEEN 1 AND 720 THEN
    RAISE EXCEPTION 'Duration must be between 1 hour and 30 days';
  END IF;
  IF p_location_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.marketplace_locations WHERE id = p_location_id
  ) THEN
    RAISE EXCEPTION 'Select a valid audience location';
  END IF;

  IF p_target_type = 'listing' THEN
    SELECT l.user_id INTO owner_id
    FROM public.listings l
    WHERE l.id::TEXT = p_target_id
      AND l.moderation_status = 'approved'
      AND lower(COALESCE(l.status, 'available')) IN ('active', 'available')
      AND NOT public.listing_is_expired(l)
      AND (
        l.store_id IS NULL OR EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = l.store_id AND s.status = 'approved' AND s.archived_at IS NULL
        )
      )
    FOR UPDATE OF l;
  ELSIF p_target_type = 'ad' THEN
    SELECT a.user_id INTO owner_id
    FROM public.store_ads a
    JOIN public.stores s ON s.id = a.store_id
    WHERE a.id = p_target_id
      AND a.moderation_status = 'approved'
      AND a.status = 'Active'
      AND s.status = 'approved'
      AND s.archived_at IS NULL
      AND (
        NULLIF(a.ad_data ->> 'startDate', '') IS NULL
        OR (
          a.ad_data ->> 'startDate' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
          AND a.ad_data ->> 'startDate' <= to_char(CURRENT_DATE, 'YYYY-MM-DD')
        )
      )
      AND (
        COALESCE(a.ad_data ->> 'scheduleType', 'continuous') <> 'end_date'
        OR (
          a.ad_data ->> 'endDate' ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
          AND a.ad_data ->> 'endDate' >= to_char(CURRENT_DATE, 'YYYY-MM-DD')
        )
      )
    FOR UPDATE OF a;
  ELSE
    SELECT s.user_id INTO owner_id
    FROM public.stores s
    WHERE s.id::TEXT = p_target_id
      AND s.status = 'approved'
      AND s.archived_at IS NULL
    FOR UPDATE OF s;
  END IF;

  IF owner_id IS DISTINCT FROM caller_id THEN
    RAISE EXCEPTION 'Only the owner of an approved, active item can boost it';
  END IF;

  UPDATE public.boosts
  SET status = 'ended', end_reason = 'expired'
  WHERE target_type = p_target_type
    AND target_id = p_target_id
    AND status = 'active'
    AND ends_at <= NOW();
  IF EXISTS (
    SELECT 1 FROM public.boosts
    WHERE target_type = p_target_type
      AND target_id = p_target_id
      AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'This item already has an active boost';
  END IF;

  INSERT INTO public.boosts (
    target_type, target_id, reach_percent, starts_at, ends_at, location_id, created_by
  )
  VALUES (
    p_target_type, p_target_id, p_reach_percent, NOW(),
    NOW() + make_interval(hours => p_duration_hours), p_location_id, caller_id
  )
  RETURNING id INTO created_boost_id;

  RETURN created_boost_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_visibility_boost(TEXT, TEXT, INTEGER, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_visibility_boost(TEXT, TEXT, INTEGER, INTEGER, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.record_boost_event(
  p_boost_id UUID,
  p_event_type TEXT,
  p_viewer_key TEXT,
  p_viewer_location_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  boost_row public.boosts%ROWTYPE;
  viewer_key TEXT;
  fingerprint TEXT;
  inserted_count INTEGER;
BEGIN
  IF p_boost_id IS NULL THEN
    RAISE EXCEPTION 'A boost id is required';
  END IF;
  IF p_event_type IS NULL OR p_event_type NOT IN ('impression', 'click') THEN
    RAISE EXCEPTION 'Unsupported boost event';
  END IF;

  IF auth.uid() IS NOT NULL THEN
    viewer_key := auth.uid()::TEXT;
    IF p_viewer_key IS DISTINCT FROM viewer_key THEN
      RAISE EXCEPTION 'Viewer identity does not match the signed-in user';
    END IF;
  ELSE
    IF p_viewer_key IS NULL OR p_viewer_key !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
      RAISE EXCEPTION 'A valid anonymous viewer key is required';
    END IF;
    viewer_key := lower(p_viewer_key);
  END IF;
  IF p_viewer_location_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.marketplace_locations WHERE id = p_viewer_location_id
  ) THEN
    RAISE EXCEPTION 'Select a valid viewer location';
  END IF;

  SELECT * INTO boost_row
  FROM public.boosts
  WHERE id = p_boost_id
    AND status = 'active'
    AND starts_at <= NOW()
    AND ends_at > NOW();
  IF NOT FOUND OR NOT public.boost_target_is_eligible(boost_row.target_type, boost_row.target_id) THEN
    RETURN FALSE;
  END IF;
  IF boost_row.location_id IS NOT NULL
     AND boost_row.location_id IS DISTINCT FROM p_viewer_location_id THEN
    RETURN FALSE;
  END IF;
  IF mod(public.boost_audience_bucket(
    viewer_key || ':' || boost_row.target_type || ':' || boost_row.target_id
  ), 100) >= boost_row.reach_percent THEN
    RETURN FALSE;
  END IF;

  fingerprint := md5(
    viewer_key || ':' || boost_row.target_type || ':' || boost_row.target_id
    || ':' || p_event_type || ':' || (NOW() AT TIME ZONE 'UTC')::DATE::TEXT
  );
  INSERT INTO public.boost_daily_events (
    target_type, target_id, event_type, event_day, viewer_fingerprint
  )
  VALUES (
    boost_row.target_type, boost_row.target_id, p_event_type, (NOW() AT TIME ZONE 'UTC')::DATE, fingerprint
  )
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN
    RETURN FALSE;
  END IF;

  DELETE FROM public.boost_daily_events
  WHERE event_day < (NOW() AT TIME ZONE 'UTC')::DATE;

  IF p_event_type = 'impression' THEN
    UPDATE public.boosts SET impressions = impressions + 1 WHERE id = p_boost_id;
  ELSE
    UPDATE public.boosts SET clicks = clicks + 1 WHERE id = p_boost_id;
  END IF;
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.record_boost_event(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_boost_event(UUID, TEXT, TEXT, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.end_unavailable_visibility_boosts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_type TEXT;
  v_target_key TEXT;
BEGIN
  v_target_type := CASE TG_TABLE_NAME
    WHEN 'listings' THEN 'listing'
    WHEN 'store_ads' THEN 'ad'
    ELSE 'store'
  END;
  v_target_key := CASE TG_TABLE_NAME
    WHEN 'listings' THEN NEW.id::TEXT
    WHEN 'store_ads' THEN NEW.id::TEXT
    ELSE NEW.id::TEXT
  END;

  IF TG_TABLE_NAME = 'stores' THEN
    UPDATE public.boosts b
    SET status = 'ended', end_reason = 'target_unavailable'
    WHERE b.status = 'active'
      AND (
        (b.target_type = 'store' AND b.target_id = v_target_key)
        OR (b.target_type = 'listing' AND EXISTS (
          SELECT 1 FROM public.listings l WHERE l.id::TEXT = b.target_id AND l.store_id::TEXT = v_target_key
        ))
        OR (b.target_type = 'ad' AND EXISTS (
          SELECT 1 FROM public.store_ads a WHERE a.id = b.target_id AND a.store_id::TEXT = v_target_key
        ))
      )
      AND NOT public.boost_target_is_eligible(b.target_type, b.target_id);
  ELSIF NOT public.boost_target_is_eligible(v_target_type, v_target_key) THEN
    UPDATE public.boosts
    SET status = 'ended', end_reason = 'target_unavailable'
    WHERE boosts.target_type = v_target_type
      AND boosts.target_id = v_target_key AND boosts.status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER end_boosts_after_listing_inactivation
  AFTER UPDATE OF moderation_status, status ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.end_unavailable_visibility_boosts();
CREATE TRIGGER end_boosts_after_ad_inactivation
  AFTER UPDATE OF moderation_status, status ON public.store_ads
  FOR EACH ROW EXECUTE FUNCTION public.end_unavailable_visibility_boosts();
CREATE TRIGGER end_boosts_after_store_inactivation
  AFTER UPDATE OF status, archived_at ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.end_unavailable_visibility_boosts();

CREATE OR REPLACE FUNCTION public.end_deleted_visibility_boosts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_type TEXT;
  v_target_key TEXT;
BEGIN
  v_target_type := CASE TG_TABLE_NAME
    WHEN 'listings' THEN 'listing'
    WHEN 'store_ads' THEN 'ad'
    ELSE 'store'
  END;
  v_target_key := CASE TG_TABLE_NAME
    WHEN 'listings' THEN OLD.id::TEXT
    WHEN 'store_ads' THEN OLD.id::TEXT
    ELSE OLD.id::TEXT
  END;

  UPDATE public.boosts b
  SET status = 'ended', end_reason = 'target_unavailable'
  WHERE b.status = 'active'
    AND (
      (b.target_type = v_target_type AND b.target_id = v_target_key)
      OR (TG_TABLE_NAME = 'stores' AND b.target_type = 'listing' AND EXISTS (
        SELECT 1 FROM public.listings l WHERE l.id::TEXT = b.target_id AND l.store_id::TEXT = v_target_key
      ))
      OR (TG_TABLE_NAME = 'stores' AND b.target_type = 'ad' AND EXISTS (
        SELECT 1 FROM public.store_ads a WHERE a.id = b.target_id AND a.store_id::TEXT = v_target_key
      ))
    );
  RETURN OLD;
END;
$$;

CREATE TRIGGER end_boosts_after_listing_delete
  AFTER DELETE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.end_deleted_visibility_boosts();
CREATE TRIGGER end_boosts_after_ad_delete
  AFTER DELETE ON public.store_ads
  FOR EACH ROW EXECUTE FUNCTION public.end_deleted_visibility_boosts();
CREATE TRIGGER end_boosts_after_store_delete
  AFTER DELETE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.end_deleted_visibility_boosts();

CREATE OR REPLACE FUNCTION public.expire_visibility_boosts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.boosts
  SET status = 'ended',
      end_reason = CASE
        WHEN ends_at <= NOW() THEN 'expired'
        ELSE 'target_unavailable'
      END
  WHERE status = 'active'
    AND (
      ends_at <= NOW()
      OR NOT public.boost_target_is_eligible(target_type, target_id)
    );
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  DELETE FROM public.boost_daily_events
  WHERE event_day < (NOW() AT TIME ZONE 'UTC')::DATE;
  RETURN expired_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_visibility_boosts() FROM PUBLIC, anon, authenticated;

DO $schedule$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    PERFORM cron.unschedule(jobid)
    FROM cron.job
    WHERE jobname = 'marketspace-expire-visibility-boosts';

    PERFORM cron.schedule(
      'marketspace-expire-visibility-boosts',
      '* * * * *',
      $job$SELECT public.expire_visibility_boosts()$job$
    );
  END IF;
END;
$schedule$;

CREATE OR REPLACE FUNCTION public.list_admin_visibility_boosts()
RETURNS TABLE (
  id UUID,
  target_type TEXT,
  target_id TEXT,
  target_title TEXT,
  owner_id UUID,
  reach_percent INTEGER,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  location_id TEXT,
  status TEXT,
  end_reason TEXT,
  impressions BIGINT,
  clicks BIGINT,
  notification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_moderator() THEN
    RAISE EXCEPTION 'Only moderators may view boost metrics';
  END IF;

  PERFORM public.expire_visibility_boosts();

  RETURN QUERY
  SELECT b.id, b.target_type, b.target_id,
    CASE b.target_type
      WHEN 'listing' THEN (SELECT l.title FROM public.listings l WHERE l.id::TEXT = b.target_id)
      WHEN 'ad' THEN (SELECT COALESCE(a.ad_data ->> 'headline', a.ad_data ->> 'adTitle', 'Advertisement') FROM public.store_ads a WHERE a.id = b.target_id)
      WHEN 'store' THEN (SELECT s.shop_name FROM public.stores s WHERE s.id::TEXT = b.target_id)
    END,
    b.created_by, b.reach_percent, b.starts_at, b.ends_at, b.location_id,
    CASE WHEN b.status = 'active' AND b.ends_at <= NOW() THEN 'expired' ELSE b.status END,
    b.end_reason, b.impressions, b.clicks, b.notification_sent_at, b.created_at
  FROM public.boosts b
  ORDER BY b.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.list_admin_visibility_boosts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_admin_visibility_boosts() TO authenticated;

CREATE OR REPLACE FUNCTION public.send_boost_expiration_notification(p_boost_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  boost_row public.boosts%ROWTYPE;
  target_title TEXT;
  notification_id UUID;
BEGIN
  IF NOT public.is_moderator() THEN
    RAISE EXCEPTION 'Only moderators may send boost notifications';
  END IF;

  SELECT * INTO boost_row
  FROM public.boosts
  WHERE id = p_boost_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Boost not found';
  END IF;
  IF boost_row.ends_at > NOW() THEN
    RAISE EXCEPTION 'This boost has not reached its end time';
  END IF;
  IF boost_row.notification_sent_at IS NOT NULL THEN
    RAISE EXCEPTION 'The expiration notification was already sent';
  END IF;
  UPDATE public.boosts
  SET status = 'ended', end_reason = COALESCE(end_reason, 'expired')
  WHERE id = p_boost_id;

  target_title := CASE boost_row.target_type
    WHEN 'listing' THEN (SELECT l.title FROM public.listings l WHERE l.id::TEXT = boost_row.target_id)
    WHEN 'ad' THEN (SELECT COALESCE(a.ad_data ->> 'headline', a.ad_data ->> 'adTitle', 'advertisement') FROM public.store_ads a WHERE a.id = boost_row.target_id)
    WHEN 'store' THEN (SELECT s.shop_name FROM public.stores s WHERE s.id::TEXT = boost_row.target_id)
  END;

  INSERT INTO public.notifications (user_id, title, body, link_url)
  VALUES (
    boost_row.created_by,
    'Your MarketSpace boost has ended',
    format('Your visibility boost for "%s" has ended. You can start another boost from your seller dashboard.', COALESCE(target_title, 'your item')),
    '/profile/store-dashboard'
  )
  RETURNING id INTO notification_id;

  UPDATE public.boosts SET notification_sent_at = NOW() WHERE id = p_boost_id;
  RETURN notification_id;
END;
$$;

REVOKE ALL ON FUNCTION public.send_boost_expiration_notification(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_boost_expiration_notification(UUID) TO authenticated;
