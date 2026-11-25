-- Hosting gate: a newly approved store is NOT hosted until its business is verified.
--
-- The moderator's approval now sets stores.status = 'awaiting_verification' for new
-- applications. Every public policy and function already requires status = 'approved',
-- so an awaiting store is hidden from shoppers without touching those policies. The
-- owner still reads their own row. Granting Business verified moves the store to
-- 'approved' (live) and notifies the owner. Stores that were approved before this
-- change keep status 'approved' and stay live.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS business_verification_required BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_status_check;
ALTER TABLE public.stores
  ADD CONSTRAINT stores_status_check
    CHECK (status IN ('draft', 'pending_review', 'awaiting_verification', 'approved', 'rejected', 'suspended'));

-- Owners must not be able to switch the requirement off.
CREATE OR REPLACE FUNCTION public.prevent_store_owner_status_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    IF TG_OP = 'INSERT' THEN
      IF NOT EXISTS (SELECT 1 FROM public.stores s WHERE s.user_id = NEW.user_id) THEN
        RAISE EXCEPTION 'Stores can only be created by the registration service';
      END IF;
    ELSIF
      NEW.status IS DISTINCT FROM OLD.status
      OR NEW.id IS DISTINCT FROM OLD.id
      OR NEW.user_id IS DISTINCT FROM OLD.user_id
      OR NEW.subdomain IS DISTINCT FROM OLD.subdomain
      OR NEW.store_type IS DISTINCT FROM OLD.store_type
      OR NEW.verified_id IS DISTINCT FROM OLD.verified_id
      OR NEW.verified_location IS DISTINCT FROM OLD.verified_location
      OR NEW.registered_business IS DISTINCT FROM OLD.registered_business
      OR NEW.business_verified_at IS DISTINCT FROM OLD.business_verified_at
      OR NEW.business_verification_required IS DISTINCT FROM OLD.business_verification_required
      OR NEW.storefront_latitude IS DISTINCT FROM OLD.storefront_latitude
      OR NEW.storefront_longitude IS DISTINCT FROM OLD.storefront_longitude
      OR NEW.business_registration_number IS DISTINCT FROM OLD.business_registration_number
      OR NEW.probation_state IS DISTINCT FROM OLD.probation_state
      OR NEW.active_listing_limit IS DISTINCT FROM OLD.active_listing_limit
      OR NEW.trust_promote_after_listings IS DISTINCT FROM OLD.trust_promote_after_listings
      OR NEW.template_id IS DISTINCT FROM OLD.template_id
      OR NEW.template_content IS DISTINCT FROM OLD.template_content
    THEN
      RAISE EXCEPTION 'Store review, trust, and template fields can only be changed by trusted services';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Reviewers may work on stores that are live or still awaiting verification.
CREATE OR REPLACE FUNCTION public.business_assert_reviewer(p_store_id UUID, p_reviewer_id UUID)
RETURNS public.stores
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_store public.stores%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.store_admins WHERE user_id = p_reviewer_id) THEN
    RAISE EXCEPTION 'Reviewer is not a moderator';
  END IF;
  SELECT * INTO target_store FROM public.stores WHERE id = p_store_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found';
  END IF;
  IF target_store.user_id = p_reviewer_id THEN
    RAISE EXCEPTION 'Moderators cannot review their own store';
  END IF;
  IF target_store.status NOT IN ('approved', 'awaiting_verification') THEN
    RAISE EXCEPTION 'Only approved stores can be business verified';
  END IF;
  RETURN target_store;
END;
$$;

-- Granting verification takes an awaiting store live and tells the owner.
CREATE OR REPLACE FUNCTION public.business_grant_verification(p_store_id UUID, p_reviewer_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_store public.stores%ROWTYPE;
  granted_at TIMESTAMPTZ := statement_timestamp();
  went_live BOOLEAN;
BEGIN
  target_store := public.business_assert_reviewer(p_store_id, p_reviewer_id);

  IF NOT EXISTS (SELECT 1 FROM public.store_business_documents WHERE store_id = p_store_id AND status = 'verified') THEN
    RAISE EXCEPTION 'A verified business document is required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.store_video_checks WHERE store_id = p_store_id AND status = 'passed') THEN
    RAISE EXCEPTION 'A passed video check is required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.store_endorsements WHERE store_id = p_store_id AND status = 'confirmed') THEN
    RAISE EXCEPTION 'A confirmed endorsement is required';
  END IF;

  went_live := target_store.status = 'awaiting_verification';

  UPDATE public.stores
  SET business_verified_at = granted_at,
      status = CASE WHEN status = 'awaiting_verification' THEN 'approved' ELSE status END
  WHERE id = p_store_id;

  INSERT INTO public.business_verification_audit_log (store_id, actor_user_id, action, details)
  VALUES (p_store_id, p_reviewer_id, 'business_verified_granted', jsonb_build_object('store_went_live', went_live));

  INSERT INTO public.notifications (user_id, title, body, link_url)
  VALUES (
    target_store.user_id,
    CASE WHEN went_live THEN 'Your store is live' ELSE 'Your store is Business verified' END,
    CASE WHEN went_live
      THEN format('Business verification is complete. "%s" is now live on MarketSpace.', target_store.shop_name)
      ELSE format('"%s" now shows the Business verified badge.', target_store.shop_name)
    END,
    '/profile'
  );

  RETURN jsonb_build_object('store_id', p_store_id, 'business_verified_at', granted_at, 'store_went_live', went_live);
END;
$$;

-- Revoking takes a store offline again when it was only ever approved on condition of
-- verification. Stores approved before the gate existed simply lose the badge.
CREATE OR REPLACE FUNCTION public.business_revoke_verification(
  p_store_id UUID,
  p_reviewer_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_store public.stores%ROWTYPE;
  clean_reason TEXT := trim(COALESCE(p_reason, ''));
  taken_offline BOOLEAN;
BEGIN
  IF clean_reason = '' OR char_length(clean_reason) > 500 THEN
    RAISE EXCEPTION 'A reason of 500 characters or fewer is required to revoke verification';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.store_admins WHERE user_id = p_reviewer_id) THEN
    RAISE EXCEPTION 'Reviewer is not a moderator';
  END IF;

  SELECT * INTO target_store FROM public.stores WHERE id = p_store_id AND business_verified_at IS NOT NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This store is not business verified';
  END IF;

  taken_offline := target_store.business_verification_required AND target_store.status = 'approved';

  UPDATE public.stores
  SET business_verified_at = NULL,
      status = CASE WHEN taken_offline THEN 'awaiting_verification' ELSE status END
  WHERE id = p_store_id;

  INSERT INTO public.business_verification_audit_log (store_id, actor_user_id, action, reason, details)
  VALUES (p_store_id, p_reviewer_id, 'business_verified_revoked', clean_reason, jsonb_build_object('store_taken_offline', taken_offline));

  INSERT INTO public.notifications (user_id, title, body, link_url)
  VALUES (
    target_store.user_id,
    CASE WHEN taken_offline THEN 'Your store is offline' ELSE 'Business verified badge removed' END,
    CASE WHEN taken_offline
      THEN format('"%s" is offline until business verification is completed again. Reason: %s', target_store.shop_name, clean_reason)
      ELSE format('The Business verified badge was removed from "%s". Reason: %s', target_store.shop_name, clean_reason)
    END,
    '/profile'
  );

  RETURN jsonb_build_object('store_id', p_store_id, 'business_verified_at', NULL, 'store_taken_offline', taken_offline);
END;
$$;

REVOKE ALL ON FUNCTION public.business_assert_reviewer(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.business_grant_verification(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.business_revoke_verification(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.business_assert_reviewer(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.business_grant_verification(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.business_revoke_verification(UUID, UUID, TEXT) TO service_role;
