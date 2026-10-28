-- Patch for 202610260001_store_registration.sql
-- Safe to re-run.

-- ---------------------------------------------------------------------------
-- Fix 1: allow trusted DB roles (postgres, supabase_admin) to change protected
-- store fields, so promote_trusted_stores() and pg_cron work. Also lock the
-- location and business registration fields so a verified store cannot move
-- its pin or swap its registration number without going through review.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_store_owner_status_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') AND (
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
  ) THEN
    RAISE EXCEPTION 'Store review and trust fields can only be changed by the review service';
  END IF;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Fix 2: bans must survive account deletion.
-- ---------------------------------------------------------------------------
ALTER TABLE public.store_banned_matches
  DROP CONSTRAINT IF EXISTS store_banned_matches_user_id_fkey;
ALTER TABLE public.store_banned_matches
  ADD CONSTRAINT store_banned_matches_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.store_banned_matches
  DROP CONSTRAINT IF EXISTS store_banned_matches_check;

CREATE OR REPLACE FUNCTION public.prepare_account_deletion(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id_hash TEXT;
  v_phone_hash TEXT;
BEGIN
  SELECT id_number_hash, phone_number_hash
    INTO v_id_hash, v_phone_hash
  FROM public.store_owner_identity
  WHERE user_id = p_user_id;

  UPDATE public.store_banned_matches
  SET id_number_hash = COALESCE(id_number_hash, v_id_hash),
      phone_hash = COALESCE(phone_hash, v_phone_hash)
  WHERE user_id = p_user_id;

  IF EXISTS (
    SELECT 1 FROM public.stores
    WHERE user_id = p_user_id AND status = 'suspended'
  ) AND (v_id_hash IS NOT NULL OR v_phone_hash IS NOT NULL) THEN
    INSERT INTO public.store_banned_matches (id_number_hash, phone_hash, reason)
    VALUES (v_id_hash, v_phone_hash, 'Account deleted while store was suspended');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.prepare_account_deletion(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prepare_account_deletion(UUID) TO service_role;

DROP FUNCTION IF EXISTS public.delete_my_account();

-- ---------------------------------------------------------------------------
-- Fix 4: profiles lost its public read policy; give owners their own row back.
-- Other users' data is read through the public_profiles view.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profile owner reads own profile" ON public.profiles;
CREATE POLICY "Profile owner reads own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
