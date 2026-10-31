CREATE TABLE IF NOT EXISTS public.store_ads (
  id TEXT PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Ended')),
  ad_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  moderation_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'removed')),
  moderation_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (moderation_reason IS NULL OR char_length(moderation_reason) <= 500),
  CHECK (pg_column_size(ad_data) < 20000)
);

ALTER TABLE public.store_ads
  DROP CONSTRAINT IF EXISTS store_ads_reviewed_by_fkey;
ALTER TABLE public.store_ads
  ADD CONSTRAINT store_ads_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.store_ad_payload_is_safe(p_ad_data JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = pg_catalog, pg_temp
AS $$
DECLARE
  media_item TEXT;
  destination TEXT := p_ad_data ->> 'destinationUrl';
BEGIN
  IF p_ad_data IS NULL OR jsonb_typeof(p_ad_data) <> 'object' THEN
    RETURN FALSE;
  END IF;

  IF destination IS NOT NULL AND (
    left(destination, 1) <> '/'
    OR destination LIKE '//%'
    OR destination ~ '[[:space:]]'
  ) THEN
    RETURN FALSE;
  END IF;

  IF p_ad_data ? 'media' THEN
    IF jsonb_typeof(p_ad_data -> 'media') NOT IN ('array', 'null') THEN
      RETURN FALSE;
    END IF;
    IF jsonb_typeof(p_ad_data -> 'media') = 'array' THEN
      IF jsonb_array_length(p_ad_data -> 'media') > 5 THEN
        RETURN FALSE;
      END IF;
      FOR media_item IN SELECT jsonb_array_elements_text(p_ad_data -> 'media')
      LOOP
        IF (
          media_item !~ '^https://[^[:space:]]+$'
          AND left(media_item, 1) <> '/'
        ) OR media_item LIKE '//%' OR media_item ~ '[[:space:]]' THEN
          RETURN FALSE;
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

ALTER TABLE public.store_ads
  ADD CONSTRAINT store_ads_payload_safe_check
  CHECK (public.store_ad_payload_is_safe(ad_data));

CREATE INDEX IF NOT EXISTS store_ads_public_idx
  ON public.store_ads (moderation_status, status, created_at DESC);
CREATE INDEX IF NOT EXISTS store_ads_owner_idx
  ON public.store_ads (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.migrate_legacy_store_ads(p_store_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  store_row RECORD;
  legacy_ad JSONB;
  legacy_id TEXT;
  inserted_count INTEGER := 0;
  rows_inserted INTEGER;
  existing_store_id UUID;
BEGIN
  FOR store_row IN
    SELECT s.id, s.user_id, s.ads
    FROM public.stores s
    WHERE (p_store_id IS NULL OR s.id = p_store_id)
      AND jsonb_typeof(COALESCE(s.ads, '[]'::jsonb)) = 'array'
  LOOP
    FOR legacy_ad IN SELECT value FROM jsonb_array_elements(COALESCE(store_row.ads, '[]'::jsonb))
    LOOP
      legacy_id := COALESCE(
        NULLIF(btrim(legacy_ad ->> 'id'), ''),
        'legacy-' || gen_random_uuid()::TEXT
      );

      INSERT INTO public.store_ads (
        id, store_id, user_id, status, ad_data, moderation_status
      )
      VALUES (
        legacy_id,
        store_row.id,
        store_row.user_id,
        CASE WHEN legacy_ad ->> 'status' IN ('Active', 'Paused', 'Ended')
          THEN legacy_ad ->> 'status' ELSE 'Active' END,
        legacy_ad - 'id' - 'status' - 'moderation_status' - 'moderation_reason' - 'reviewed_by' - 'reviewed_at',
        'approved'
      )
      ON CONFLICT (id) DO NOTHING;
      GET DIAGNOSTICS rows_inserted = ROW_COUNT;
      inserted_count := inserted_count + rows_inserted;

      SELECT store_id INTO existing_store_id
      FROM public.store_ads
      WHERE id = legacy_id;
      IF existing_store_id IS DISTINCT FROM store_row.id THEN
        RAISE EXCEPTION 'Legacy ad id % is already assigned to another store', legacy_id;
      END IF;
    END LOOP;

    UPDATE public.stores SET ads = '[]'::jsonb WHERE id = store_row.id;
  END LOOP;

  RETURN inserted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.migrate_legacy_store_ads(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.migrate_legacy_store_ads(UUID) TO service_role;

ALTER TABLE public.store_ads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.store_ads FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.store_ads TO authenticated;
GRANT SELECT ON public.store_ads TO anon;
GRANT ALL ON public.store_ads TO service_role;

DROP POLICY IF EXISTS "Approved active ads are public, owners and moderators read all" ON public.store_ads;
CREATE POLICY "Approved active ads are public, owners and moderators read all"
  ON public.store_ads FOR SELECT TO anon, authenticated
  USING (
    (moderation_status = 'approved' AND status = 'Active')
    OR user_id = (SELECT auth.uid())
    OR public.is_moderator()
  );

DROP POLICY IF EXISTS "Ad owners can create their own ads" ON public.store_ads;
CREATE POLICY "Ad owners can create their own ads"
  ON public.store_ads FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Ad owners can update their own ads" ON public.store_ads;
CREATE POLICY "Ad owners can update their own ads"
  ON public.store_ads FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Ad owners can delete their own ads" ON public.store_ads;
CREATE POLICY "Ad owners can delete their own ads"
  ON public.store_ads FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE FUNCTION public.protect_store_ad_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id IS DISTINCT FROM auth.uid()
       OR NOT EXISTS (
         SELECT 1 FROM public.stores s
         WHERE s.id = NEW.store_id AND s.user_id = auth.uid()
       ) THEN
      RAISE EXCEPTION 'Ads can only be created for the signed-in user''s store';
    END IF;
    NEW.moderation_status := 'pending';
    NEW.moderation_reason := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    IF NOT public.listing_requires_moderation(auth.uid(), NEW.store_id) THEN
      NEW.moderation_status := 'approved';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.store_id IS DISTINCT FROM OLD.store_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Ad identity and store assignment cannot be changed';
  END IF;

  IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
     OR NEW.moderation_reason IS DISTINCT FROM OLD.moderation_reason
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
    RAISE EXCEPTION 'Ad moderation fields can only be changed by moderators';
  END IF;

  IF NEW.ad_data IS DISTINCT FROM OLD.ad_data
     AND OLD.moderation_status IN ('approved', 'rejected') THEN
    NEW.moderation_reason := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    IF public.listing_requires_moderation(NEW.user_id, NEW.store_id) THEN
      NEW.moderation_status := 'pending';
    ELSIF OLD.moderation_status = 'rejected' THEN
      NEW.moderation_status := 'approved';
    END IF;
  END IF;

  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_store_ad_moderation_fields ON public.store_ads;
CREATE TRIGGER protect_store_ad_moderation_fields
  BEFORE INSERT OR UPDATE ON public.store_ads
  FOR EACH ROW EXECUTE FUNCTION public.protect_store_ad_moderation_fields();

CREATE OR REPLACE FUNCTION public.review_store_ad_moderation(
  p_ad_id TEXT,
  p_reviewer_id UUID,
  p_decision TEXT,
  p_reason TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  clean_reason TEXT := btrim(COALESCE(p_reason, ''));
  reviewed_ad public.store_ads%ROWTYPE;
BEGIN
  IF p_ad_id IS NULL OR btrim(p_ad_id) = ''
     OR p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid ad review decision';
  END IF;
  IF p_decision = 'rejected' AND clean_reason = '' THEN
    RAISE EXCEPTION 'A reason is required when rejecting an ad';
  END IF;
  IF char_length(clean_reason) > 500 THEN
    RAISE EXCEPTION 'The rejection reason must be 500 characters or fewer';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.store_admins WHERE user_id = p_reviewer_id) THEN
    RAISE EXCEPTION 'Reviewer is not an ad moderator';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.store_ads a
    WHERE a.id = p_ad_id
      AND a.user_id = p_reviewer_id
      AND a.moderation_status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Moderators cannot review their own ads';
  END IF;

  UPDATE public.store_ads
  SET moderation_status = p_decision,
      moderation_reason = NULLIF(clean_reason, ''),
      reviewed_by = p_reviewer_id,
      reviewed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_ad_id
    AND moderation_status = 'pending'
  RETURNING * INTO reviewed_ad;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ad is missing or no longer pending';
  END IF;

  INSERT INTO public.moderation_audit_log (
    entity_type, entity_id, actor_user_id, action, reason, details
  )
  VALUES (
    'ad',
    reviewed_ad.id,
    p_reviewer_id,
    p_decision,
    NULLIF(clean_reason, ''),
    jsonb_build_object('store_id', reviewed_ad.store_id, 'user_id', reviewed_ad.user_id)
  );

  INSERT INTO public.notifications (user_id, title, body, link_url)
  VALUES (
    reviewed_ad.user_id,
    CASE p_decision WHEN 'approved' THEN 'Ad approved' ELSE 'Ad rejected' END,
    CASE p_decision
      WHEN 'approved' THEN format('Your ad "%s" is now live.', COALESCE(reviewed_ad.ad_data ->> 'headline', reviewed_ad.ad_data ->> 'adTitle', 'Untitled ad'))
      ELSE format('Your ad "%s" was rejected. Reason: %s', COALESCE(reviewed_ad.ad_data ->> 'headline', reviewed_ad.ad_data ->> 'adTitle', 'Untitled ad'), clean_reason)
    END,
    '/profile'
  );

  RETURN jsonb_build_object(
    'id', reviewed_ad.id,
    'moderation_status', reviewed_ad.moderation_status,
    'moderation_reason', reviewed_ad.moderation_reason,
    'reviewed_by', reviewed_ad.reviewed_by,
    'reviewed_at', reviewed_ad.reviewed_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_store_ad_moderation(TEXT, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_store_ad_moderation(TEXT, UUID, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_ad_engagement_visibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.store_ads a
    WHERE a.id = NEW.ad_id
      AND a.moderation_status = 'approved'
      AND a.status = 'Active'
  ) THEN
    RAISE EXCEPTION 'Only approved active ads can receive engagement';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ad_likes_require_visible_ad ON public.ad_likes;
CREATE TRIGGER ad_likes_require_visible_ad
  BEFORE INSERT ON public.ad_likes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_ad_engagement_visibility();

DROP TRIGGER IF EXISTS ad_comments_require_visible_ad ON public.ad_comments;
CREATE TRIGGER ad_comments_require_visible_ad
  BEFORE INSERT ON public.ad_comments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_ad_engagement_visibility();

DROP POLICY IF EXISTS "Ad likes are publicly readable" ON public.ad_likes;
CREATE POLICY "Ad likes are publicly readable" ON public.ad_likes
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.store_ads a
    WHERE a.id = ad_likes.ad_id
      AND a.moderation_status = 'approved'
      AND a.status = 'Active'
  ));

DROP POLICY IF EXISTS "Authenticated users can like ads" ON public.ad_likes;
CREATE POLICY "Authenticated users can like ads" ON public.ad_likes
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.store_ads a
      WHERE a.id = ad_likes.ad_id
        AND a.moderation_status = 'approved'
        AND a.status = 'Active'
    )
  );

DROP POLICY IF EXISTS "Ad comments are publicly readable" ON public.ad_comments;
CREATE POLICY "Ad comments are publicly readable" ON public.ad_comments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.store_ads a
    WHERE a.id = ad_comments.ad_id
      AND a.moderation_status = 'approved'
      AND a.status = 'Active'
  ));

DROP POLICY IF EXISTS "Authenticated users can comment on ads" ON public.ad_comments;
CREATE POLICY "Authenticated users can comment on ads" ON public.ad_comments
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.store_ads a
      WHERE a.id = ad_comments.ad_id
        AND a.moderation_status = 'approved'
        AND a.status = 'Active'
    )
  );

SELECT public.migrate_legacy_store_ads();
