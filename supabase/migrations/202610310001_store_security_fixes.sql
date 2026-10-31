-- Security fixes after reviewing the template phases.
-- Safe to re-run.
--
-- 1. Migration 202610300005 added an INSERT policy on public.stores, and the
--    protection trigger rewritten in 202610290001 only checks template fields on
--    INSERT. Because stores.status defaults to 'approved' and probation_state to
--    'trusted', any signed-in user could insert their own approved, unlimited
--    store and skip the whole verification wizard.
-- 2. The 202610290001 rewrite also dropped three things the earlier fixes
--    migration had added: the trusted roles (postgres, supabase_admin), so
--    promote_trusted_stores() and pg_cron are blocked again, and the locks on
--    storefront_latitude, storefront_longitude and business_registration_number.
--
-- The INSERT policy is kept because client upserts of an existing store need it.
-- The trigger now refuses to let a normal user create a NEW store row.

CREATE OR REPLACE FUNCTION public.prevent_store_owner_status_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    IF TG_OP = 'INSERT' THEN
      -- An upsert of an existing store arrives here first; allow it and let the
      -- UPDATE path below decide what may change. Creating a new store is not allowed.
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
      OR NEW.payout_hold_days IS DISTINCT FROM OLD.payout_hold_days
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

DROP TRIGGER IF EXISTS protect_store_review_fields ON public.stores;
CREATE TRIGGER protect_store_review_fields
  BEFORE INSERT OR UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.prevent_store_owner_status_changes();
