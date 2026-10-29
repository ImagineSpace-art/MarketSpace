ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS template_id TEXT,
  ADD COLUMN IF NOT EXISTS template_content JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.stores
  DROP CONSTRAINT IF EXISTS stores_template_id_check,
  ADD CONSTRAINT stores_template_id_check
    CHECK (template_id IS NULL OR template_id IN ('boutique-grid', 'storefront-landing')),
  DROP CONSTRAINT IF EXISTS stores_template_content_object_check,
  ADD CONSTRAINT stores_template_content_object_check
    CHECK (jsonb_typeof(template_content) = 'object');

CREATE OR REPLACE FUNCTION public.prevent_store_owner_status_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.template_id IS NOT NULL OR NEW.template_content IS DISTINCT FROM '{}'::jsonb THEN
        RAISE EXCEPTION 'Store templates can only be changed by the template service';
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

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'store-assets',
  'store-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read store assets" ON storage.objects;
CREATE POLICY "Public read store assets"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'store-assets');

DROP POLICY IF EXISTS "Owners upload store assets" ON storage.objects;
CREATE POLICY "Owners upload store assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Owners update store assets" ON storage.objects;
CREATE POLICY "Owners update store assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS "Owners delete store assets" ON storage.objects;
CREATE POLICY "Owners delete store assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'store-assets'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
