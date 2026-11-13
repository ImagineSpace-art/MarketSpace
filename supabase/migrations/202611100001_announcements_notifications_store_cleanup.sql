CREATE TABLE IF NOT EXISTS public.site_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(BTRIM(title)) BETWEEN 1 AND 120),
  body TEXT NOT NULL CHECK (char_length(BTRIM(body)) BETWEEN 1 AND 5000),
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS site_announcements_single_active_idx
  ON public.site_announcements ((is_active))
  WHERE is_active;

ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_announcements FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, title, body, is_active, created_at) ON public.site_announcements TO anon, authenticated;

DROP POLICY IF EXISTS "Public read active announcements" ON public.site_announcements;
CREATE POLICY "Public read active announcements"
  ON public.site_announcements FOR SELECT TO anon, authenticated
  USING (is_active OR public.is_moderator());

CREATE OR REPLACE FUNCTION public.publish_site_announcement(p_title TEXT, p_body TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  announcement_id UUID;
BEGIN
  IF NOT public.is_moderator() THEN
    RAISE EXCEPTION 'Only moderators can publish announcements';
  END IF;
  IF char_length(BTRIM(COALESCE(p_title, ''))) NOT BETWEEN 1 AND 120
    OR char_length(BTRIM(COALESCE(p_body, ''))) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'Enter an announcement title and a message of at most 5000 characters';
  END IF;

  UPDATE public.site_announcements SET is_active = false WHERE is_active;
  INSERT INTO public.site_announcements (title, body, is_active, created_by)
  VALUES (BTRIM(p_title), BTRIM(p_body), true, auth.uid())
  RETURNING id INTO announcement_id;
  RETURN announcement_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.dismiss_site_announcement(p_announcement_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_moderator() THEN
    RAISE EXCEPTION 'Only moderators can manage announcements';
  END IF;
  UPDATE public.site_announcements SET is_active = false
  WHERE id = p_announcement_id AND is_active;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'The active announcement could not be found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_site_announcement(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dismiss_site_announcement(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_site_announcement(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dismiss_site_announcement(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_listing_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF lower(COALESCE(NEW.status, '')) = 'expired'
    AND (TG_OP = 'INSERT' OR lower(COALESCE(OLD.status, '')) <> 'expired') THEN
    INSERT INTO public.notifications (user_id, title, body, link_url)
    VALUES (
      NEW.user_id,
      'Listing expired',
      format('Your listing "%s" has expired and is no longer visible to shoppers. Renew it from your seller dashboard when you are ready.', NEW.title),
      '/profile'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_listing_expiration ON public.listings;
CREATE TRIGGER notify_listing_expiration
  AFTER INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.notify_listing_expiration();

CREATE OR REPLACE FUNCTION public.notify_store_application_decision()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.status = 'pending_review' AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.notifications (user_id, title, body, link_url)
    VALUES (
      NEW.user_id,
      CASE NEW.status WHEN 'approved' THEN 'Store application approved' ELSE 'Store application not approved' END,
      CASE NEW.status
        WHEN 'approved' THEN format('Your store application for "%s" has been approved. Your store is now open on MarketSpace.', NEW.shop_name)
        ELSE format('Your store application for "%s" was not approved. Review the feedback in your store dashboard and update your application to try again. %s', NEW.shop_name, COALESCE(NULLIF(BTRIM(NEW.rejection_reason), ''), ''))
      END,
      '/profile/store-dashboard'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notify_store_application_decision ON public.stores;
CREATE TRIGGER notify_store_application_decision
  AFTER UPDATE OF status ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.notify_store_application_decision();

DELETE FROM public.store_followers
WHERE user_id IS NOT NULL AND store_id = user_id::TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.store_followers'::regclass
      AND conname = 'store_followers_no_self_follow'
  ) THEN
    ALTER TABLE public.store_followers
      ADD CONSTRAINT store_followers_no_self_follow
      CHECK (user_id IS NULL OR store_id <> user_id::TEXT);
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.store_deletion_cleanup (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  public_media_paths TEXT[] NOT NULL DEFAULT '{}',
  private_media_paths TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (cardinality(public_media_paths) > 0 OR cardinality(private_media_paths) > 0)
);

ALTER TABLE public.store_deletion_cleanup ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_deletion_cleanup FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.store_deletion_cleanup TO service_role;

CREATE OR REPLACE FUNCTION public.delete_store_completely(
  p_store_id UUID,
  p_actor_id UUID,
  p_fraud_abuse BOOLEAN,
  p_reason TEXT,
  p_public_media_paths TEXT[] DEFAULT '{}',
  p_private_media_paths TEXT[] DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  store_row public.stores%ROWTYPE;
  cleanup_id UUID;
  listing_ids BIGINT[];
  ad_ids TEXT[];
BEGIN
  IF p_actor_id IS NULL OR p_fraud_abuse IS NULL THEN
    RAISE EXCEPTION 'A valid store-deletion actor and action are required';
  END IF;

  SELECT * INTO store_row
  FROM public.stores
  WHERE id = p_store_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found';
  END IF;

  IF p_fraud_abuse THEN
    IF NOT EXISTS (SELECT 1 FROM public.store_admins WHERE user_id = p_actor_id) THEN
      RAISE EXCEPTION 'Only moderators can remove a store for fraud or abuse';
    END IF;
    IF char_length(BTRIM(COALESCE(p_reason, ''))) NOT BETWEEN 1 AND 500 THEN
      RAISE EXCEPTION 'A reason is required for a fraud or abuse removal';
    END IF;

    INSERT INTO public.store_banned_matches (user_id, id_number_hash, phone_hash, reason)
    SELECT store_row.user_id, identity.id_number_hash, identity.phone_number_hash, BTRIM(p_reason)
    FROM public.store_owner_identity identity
    WHERE identity.user_id = store_row.user_id;
    IF NOT FOUND THEN
      INSERT INTO public.store_banned_matches (user_id, reason)
      VALUES (store_row.user_id, BTRIM(p_reason));
    END IF;
  ELSE
    IF p_actor_id IS DISTINCT FROM store_row.user_id OR store_row.archived_at IS NULL THEN
      RAISE EXCEPTION 'Only the owner of an archived store can permanently delete it';
    END IF;
  END IF;

  IF cardinality(COALESCE(p_public_media_paths, '{}')) > 0
    OR cardinality(COALESCE(p_private_media_paths, '{}')) > 0 THEN
    INSERT INTO public.store_deletion_cleanup (
      store_id,
      owner_user_id,
      public_media_paths,
      private_media_paths
    )
    VALUES (
      p_store_id,
      store_row.user_id,
      COALESCE(p_public_media_paths, '{}'),
      COALESCE(p_private_media_paths, '{}')
    )
    RETURNING id INTO cleanup_id;
  END IF;

  SELECT COALESCE(array_agg(id), '{}') INTO listing_ids
  FROM public.listings WHERE store_id = p_store_id;
  SELECT COALESCE(array_agg(id), '{}') INTO ad_ids
  FROM public.store_ads WHERE store_id = p_store_id;

  DELETE FROM public.boost_daily_events
  WHERE (target_type = 'store' AND target_id = p_store_id::TEXT)
    OR (target_type = 'listing' AND target_id = ANY(listing_ids::TEXT[]))
    OR (target_type = 'ad' AND target_id = ANY(ad_ids));
  DELETE FROM public.boosts
  WHERE (target_type = 'store' AND target_id = p_store_id::TEXT)
    OR (target_type = 'listing' AND target_id = ANY(listing_ids::TEXT[]))
    OR (target_type = 'ad' AND target_id = ANY(ad_ids));
  DELETE FROM public.analytics_events
  WHERE store_id IN (p_store_id::TEXT, store_row.user_id::TEXT)
    OR listing_id = ANY(listing_ids)
    OR ad_id = ANY(ad_ids);
  DELETE FROM public.store_followers WHERE store_id = store_row.user_id::TEXT;
  DELETE FROM public.chats WHERE listing_id = ANY(listing_ids);
  DELETE FROM public.ad_likes WHERE ad_id = ANY(ad_ids);
  DELETE FROM public.ad_comments WHERE ad_id = ANY(ad_ids);
  DELETE FROM public.listings WHERE store_id = p_store_id;
  DELETE FROM public.reviews WHERE store_id = p_store_id;
  DELETE FROM public.store_ads WHERE store_id = p_store_id;
  DELETE FROM public.store_registration_drafts WHERE user_id = store_row.user_id;
  DELETE FROM public.store_owner_identity WHERE user_id = store_row.user_id;

  DELETE FROM public.stores WHERE id = p_store_id;

  IF p_fraud_abuse THEN
    INSERT INTO public.store_review_audit_log (store_id, actor_user_id, action, reason)
    VALUES (p_store_id, p_actor_id, 'store_deleted_for_fraud_or_abuse', BTRIM(p_reason));
  END IF;

  RETURN cleanup_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_store_completely(UUID, UUID, BOOLEAN, TEXT, TEXT[], TEXT[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_store_completely(UUID, UUID, BOOLEAN, TEXT, TEXT[], TEXT[]) TO service_role;

REVOKE ALL ON FUNCTION public.delete_archived_owned_store(UUID) FROM PUBLIC, anon, authenticated;
