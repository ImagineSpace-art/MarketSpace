DROP FUNCTION IF EXISTS public.store_can_accept_order(UUID, NUMERIC);

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS trust_promote_after_listings INTEGER NOT NULL DEFAULT 5
    CHECK (trust_promote_after_listings > 0),
  DROP COLUMN IF EXISTS max_order_value_zmw,
  DROP COLUMN IF EXISTS completed_order_count,
  DROP COLUMN IF EXISTS trust_promote_after_orders,
  DROP COLUMN IF EXISTS trust_minimum_rating;

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

CREATE INDEX IF NOT EXISTS moderation_audit_log_listing_approval_idx
  ON public.moderation_audit_log (entity_type, action, entity_id)
  WHERE entity_type = 'listing' AND action = 'approved';

CREATE OR REPLACE FUNCTION public.promote_store_if_eligible(p_store_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_store public.stores%ROWTYPE;
  approved_listing_count INTEGER;
BEGIN
  SELECT * INTO target_store
  FROM public.stores
  WHERE id = p_store_id
    AND status = 'approved'
    AND probation_state = 'probation'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(DISTINCT a.entity_id)::INTEGER
  INTO approved_listing_count
  FROM public.moderation_audit_log a
  JOIN public.listings l ON l.id::TEXT = a.entity_id
  WHERE a.entity_type = 'listing'
    AND a.action = 'approved'
    AND l.store_id = target_store.id;

  IF approved_listing_count < target_store.trust_promote_after_listings THEN
    RETURN FALSE;
  END IF;

  UPDATE public.stores
  SET probation_state = 'trusted',
      active_listing_limit = 2147483647
  WHERE id = target_store.id
    AND probation_state = 'probation';

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_store_if_eligible(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_store_if_eligible(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.promote_trusted_stores()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  store_row RECORD;
  promoted_count INTEGER := 0;
BEGIN
  FOR store_row IN
    SELECT id
    FROM public.stores
    WHERE status = 'approved' AND probation_state = 'probation'
  LOOP
    IF public.promote_store_if_eligible(store_row.id) THEN
      promoted_count := promoted_count + 1;
    END IF;
  END LOOP;

  RETURN promoted_count;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_trusted_stores() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_trusted_stores() TO service_role;

CREATE OR REPLACE FUNCTION public.promote_store_after_listing_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  listing_store_id UUID;
BEGIN
  IF NEW.entity_type = 'listing' AND NEW.action = 'approved' THEN
    SELECT store_id INTO listing_store_id
    FROM public.listings
    WHERE id::TEXT = NEW.entity_id;

    IF listing_store_id IS NOT NULL THEN
      PERFORM public.promote_store_if_eligible(listing_store_id);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS promote_store_after_listing_approval ON public.moderation_audit_log;
CREATE TRIGGER promote_store_after_listing_approval
  AFTER INSERT ON public.moderation_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.promote_store_after_listing_approval();

SELECT public.promote_trusted_stores();
