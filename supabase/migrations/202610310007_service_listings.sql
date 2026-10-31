ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS price_unit TEXT NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS service_area_id TEXT REFERENCES public.marketplace_locations(id) ON DELETE SET NULL;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS delivery_option TEXT;

ALTER TABLE public.listings
  ALTER COLUMN condition DROP NOT NULL,
  ALTER COLUMN delivery_option DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.listings'::regclass
      AND conname = 'listings_price_unit_check'
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_price_unit_check
      CHECK (price_unit IN ('fixed', 'from', 'per_hour', 'per_day'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.listings'::regclass
      AND conname = 'listings_service_fields_check'
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_service_fields_check
      CHECK (
        listing_type = 'service'
        OR (price_unit = 'fixed' AND service_area_id IS NULL)
      );
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS listings_service_area_idx
  ON public.listings (service_area_id)
  WHERE listing_type = 'service';

CREATE OR REPLACE FUNCTION public.enforce_service_listing_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  prohibited_text TEXT;
BEGIN
  IF NEW.listing_type IS DISTINCT FROM 'service' THEN
    NEW.price_unit := 'fixed';
    NEW.service_area_id := NULL;
    RETURN NEW;
  END IF;

  NEW.price_unit := COALESCE(NEW.price_unit, 'fixed');
  NEW.condition := NULL;
  NEW.delivery_option := NULL;
  NEW.available_colors := '{}';
  NEW.lowest_acceptable_price := NULL;
  NEW.delivery_paid_by := NULL;

  IF TG_OP = 'INSERT'
     OR NEW.listing_type IS DISTINCT FROM OLD.listing_type
     OR NEW.title IS DISTINCT FROM OLD.title
     OR NEW.description IS DISTINCT FROM OLD.description
     OR NEW.how_it_works IS DISTINCT FROM OLD.how_it_works THEN
    prohibited_text := lower(concat_ws(' ', NEW.title, NEW.description, NEW.how_it_works));
    IF prohibited_text ~ '(counterfeit|fake[[:space:]]+id|stolen[[:space:]]+goods|illegal[[:space:]]+drugs|firearms|weapon[[:space:]]+sales|human[[:space:]]+trafficking|child[[:space:]]+exploitation)' THEN
      RAISE EXCEPTION 'Listing contains prohibited content';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS listings_service_rules ON public.listings;
CREATE TRIGGER listings_service_rules
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_service_listing_rules();

GRANT SELECT ON public.marketplace_locations TO anon, authenticated;
