UPDATE public.store_registration_drafts
SET current_step = CASE
      WHEN current_step >= 7 THEN 6
      WHEN current_step = 6 THEN 5
      ELSE current_step
    END,
    data = COALESCE(data, '{}'::jsonb) - 'payout';

UPDATE public.store_review_checks
SET results = COALESCE(results, '{}'::jsonb) - 'payoutNameMatch' - 'payoutNameFlagged';

ALTER TABLE public.store_registration_drafts
  DROP CONSTRAINT IF EXISTS store_registration_drafts_current_step_check,
  ADD CONSTRAINT store_registration_drafts_current_step_check
    CHECK (current_step BETWEEN 1 AND 6);

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
      OR NEW.max_order_value_zmw IS DISTINCT FROM OLD.max_order_value_zmw
      OR NEW.completed_order_count IS DISTINCT FROM OLD.completed_order_count
      OR NEW.trust_promote_after_orders IS DISTINCT FROM OLD.trust_promote_after_orders
      OR NEW.trust_minimum_rating IS DISTINCT FROM OLD.trust_minimum_rating
      OR NEW.template_id IS DISTINCT FROM OLD.template_id
      OR NEW.template_content IS DISTINCT FROM OLD.template_content
    THEN
      RAISE EXCEPTION 'Store review, trust, and template fields can only be changed by trusted services';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_trusted_stores()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  promoted_count INTEGER;
BEGIN
  UPDATE public.stores s
  SET probation_state = 'trusted',
      active_listing_limit = 2147483647
  WHERE s.status = 'approved'
    AND s.probation_state = 'probation'
    AND s.completed_order_count >= s.trust_promote_after_orders
    AND COALESCE((
      SELECT AVG(r.rating)::NUMERIC
      FROM public.reviews r
      WHERE r.store_id = s.id
    ), 0) >= s.trust_minimum_rating;

  GET DIAGNOSTICS promoted_count = ROW_COUNT;
  RETURN promoted_count;
END;
$$;

DROP TABLE IF EXISTS public.store_payout_accounts;

ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_payout_hold_days_check,
  DROP COLUMN IF EXISTS payout_hold_days;
