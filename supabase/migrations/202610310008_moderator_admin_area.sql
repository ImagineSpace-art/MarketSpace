ALTER TABLE public.store_admins
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'moderator';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.store_admins'::regclass
      AND conname = 'store_admins_role_check'
  ) THEN
    ALTER TABLE public.store_admins
      ADD CONSTRAINT store_admins_role_check CHECK (role IN ('moderator', 'admin'));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.protect_store_admin_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  remaining_admins INTEGER;
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    RAISE EXCEPTION 'Moderator assignments can only be changed by a database administrator';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('store_admins_last_admin_guard'));

  IF TG_OP = 'DELETE' AND OLD.role = 'admin' THEN
    SELECT COUNT(*) INTO remaining_admins
    FROM public.store_admins
    WHERE role = 'admin'
      AND user_id <> OLD.user_id;
    IF remaining_admins = 0 THEN
      RAISE EXCEPTION 'The last admin cannot be removed';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role <> 'admin' THEN
    SELECT COUNT(*) INTO remaining_admins
    FROM public.store_admins
    WHERE role = 'admin'
      AND user_id <> OLD.user_id;
    IF remaining_admins = 0 THEN
      RAISE EXCEPTION 'The last admin cannot be demoted';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_admins_protect_assignments ON public.store_admins;
CREATE TRIGGER store_admins_protect_assignments
  BEFORE UPDATE OR DELETE ON public.store_admins
  FOR EACH ROW EXECUTE FUNCTION public.protect_store_admin_assignments();

REVOKE INSERT, UPDATE, DELETE ON public.store_admins FROM anon, authenticated;

CREATE TABLE IF NOT EXISTS public.admin_auth_rate_limits (
  identifier_hash TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('request_email', 'request_ip', 'verify_email', 'verify_ip')),
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hit_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (identifier_hash, scope)
);

ALTER TABLE public.admin_auth_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_auth_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.admin_auth_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_admin_auth_rate_limit(
  p_identifier_hash TEXT,
  p_scope TEXT,
  p_limit INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  new_hit_count INTEGER;
BEGIN
  IF p_identifier_hash !~ '^[0-9a-f]{64}$'
     OR p_scope NOT IN ('request_email', 'request_ip', 'verify_email', 'verify_ip')
     OR p_limit < 1 OR p_limit > 10 THEN
    RAISE EXCEPTION 'Invalid admin authentication rate-limit input';
  END IF;

  INSERT INTO public.admin_auth_rate_limits (identifier_hash, scope, window_started_at, hit_count)
  VALUES (p_identifier_hash, p_scope, NOW(), 1)
  ON CONFLICT (identifier_hash, scope) DO UPDATE
  SET window_started_at = CASE
        WHEN public.admin_auth_rate_limits.window_started_at <= NOW() - INTERVAL '1 hour' THEN NOW()
        ELSE public.admin_auth_rate_limits.window_started_at
      END,
      hit_count = CASE
        WHEN public.admin_auth_rate_limits.window_started_at <= NOW() - INTERVAL '1 hour' THEN 1
        ELSE public.admin_auth_rate_limits.hit_count + 1
      END
  RETURNING hit_count INTO new_hit_count;

  RETURN new_hit_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_admin_auth_rate_limit(TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_admin_auth_rate_limit(TEXT, TEXT, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_email_is_eligible(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.store_admins moderators
    JOIN auth.users users ON users.id = moderators.user_id
    WHERE lower(users.email) = lower(trim(p_email))
      AND users.email_confirmed_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.admin_email_is_eligible(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_email_is_eligible(TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.protect_listing_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  assigned_store_id UUID;
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Listings can only be created for the signed-in user';
    END IF;

    SELECT s.id
      INTO assigned_store_id
      FROM public.stores s
      WHERE s.user_id = auth.uid()
        AND s.status = 'approved'
      LIMIT 1;

    NEW.store_id := assigned_store_id;
    NEW.sponsored := FALSE;
    NEW.moderation_status := 'pending';
    NEW.moderation_reason := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;

    IF assigned_store_id IS NOT NULL
       AND NOT public.listing_requires_moderation(auth.uid(), assigned_store_id) THEN
      NEW.moderation_status := 'approved';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.store_id IS DISTINCT FROM OLD.store_id
     OR NEW.sponsored IS DISTINCT FROM OLD.sponsored THEN
    RAISE EXCEPTION 'Listing store assignment and sponsorship can only be changed by trusted services';
  END IF;

  IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
     OR NEW.moderation_reason IS DISTINCT FROM OLD.moderation_reason
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
    RAISE EXCEPTION 'Listing moderation fields can only be changed by moderators';
  END IF;

  IF OLD.moderation_status IN ('approved', 'rejected')
     AND (
       NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.price IS DISTINCT FROM OLD.price
       OR NEW.category IS DISTINCT FROM OLD.category
       OR NEW.images IS DISTINCT FROM OLD.images
       OR NEW.listing_type IS DISTINCT FROM OLD.listing_type
     ) THEN
    NEW.moderation_reason := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    IF public.listing_requires_moderation(NEW.user_id, NEW.store_id) THEN
      NEW.moderation_status := 'pending';
    ELSIF OLD.moderation_status = 'rejected' THEN
      NEW.moderation_status := 'approved';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.review_listing_moderation(
  p_listing_id BIGINT,
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
  reviewed_listing public.listings%ROWTYPE;
  clean_reason TEXT := trim(COALESCE(p_reason, ''));
BEGIN
  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid listing review decision';
  END IF;
  IF char_length(clean_reason) > 500 THEN
    RAISE EXCEPTION 'Review reason must be 500 characters or fewer';
  END IF;
  IF p_decision = 'rejected' AND clean_reason = '' THEN
    RAISE EXCEPTION 'A reason is required when rejecting a listing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.store_admins WHERE user_id = p_reviewer_id) THEN
    RAISE EXCEPTION 'Reviewer is not a listing moderator';
  END IF;
  IF EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = p_listing_id
      AND l.user_id = p_reviewer_id
      AND l.moderation_status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Moderators cannot review their own listings';
  END IF;

  UPDATE public.listings
  SET moderation_status = p_decision,
      moderation_reason = NULLIF(clean_reason, ''),
      reviewed_by = p_reviewer_id,
      reviewed_at = NOW()
  WHERE id = p_listing_id
    AND moderation_status = 'pending'
    AND user_id IS DISTINCT FROM p_reviewer_id
  RETURNING * INTO reviewed_listing;

  IF reviewed_listing.id IS NULL THEN
    RAISE EXCEPTION 'Listing is no longer pending review';
  END IF;

  INSERT INTO public.moderation_audit_log (
    entity_type, entity_id, actor_user_id, action, reason, details
  )
  VALUES (
    'listing',
    reviewed_listing.id::TEXT,
    p_reviewer_id,
    p_decision,
    NULLIF(clean_reason, ''),
    jsonb_build_object('listing_title', reviewed_listing.title, 'seller_id', reviewed_listing.user_id)
  );

  INSERT INTO public.notifications (user_id, title, body, link_url)
  VALUES (
    reviewed_listing.user_id,
    CASE p_decision WHEN 'approved' THEN 'Listing approved' ELSE 'Listing rejected' END,
    CASE p_decision
      WHEN 'approved' THEN format('Your listing "%s" is now live.', reviewed_listing.title)
      ELSE format('Your listing "%s" was rejected. Reason: %s', reviewed_listing.title, clean_reason)
    END,
    '/profile'
  );

  RETURN jsonb_build_object(
    'id', reviewed_listing.id,
    'user_id', reviewed_listing.user_id,
    'title', reviewed_listing.title,
    'moderation_status', reviewed_listing.moderation_status,
    'moderation_reason', reviewed_listing.moderation_reason
  );
END;
$$;

REVOKE ALL ON FUNCTION public.review_listing_moderation(BIGINT, UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_listing_moderation(BIGINT, UUID, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.get_moderation_audit_log()
RETURNS TABLE (
  created_at TIMESTAMPTZ,
  source TEXT,
  entity_type TEXT,
  entity_id TEXT,
  actor_user_id UUID,
  action TEXT,
  reason TEXT,
  details JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_moderator() THEN
    RAISE EXCEPTION 'Not authorized to read moderation audit records';
  END IF;

  RETURN QUERY
  SELECT audit.created_at, 'store_review'::TEXT,
         CASE WHEN audit.action LIKE 'store_report_%' THEN 'report' ELSE 'store_application' END,
         COALESCE(audit.details ->> 'report_id', audit.store_id::TEXT),
         audit.actor_user_id, audit.action, audit.reason, audit.details
  FROM public.store_review_audit_log audit
  UNION ALL
  SELECT audit.created_at, 'listing_moderation'::TEXT, audit.entity_type,
         audit.entity_id, audit.actor_user_id, audit.action, audit.reason, audit.details
  FROM public.moderation_audit_log audit
  ORDER BY 1 DESC
  LIMIT 500;
END;
$$;

REVOKE ALL ON FUNCTION public.get_moderation_audit_log() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_moderation_audit_log() TO authenticated;
