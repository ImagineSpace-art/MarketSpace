CREATE TABLE IF NOT EXISTS public.seller_verifications (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'none'
    CHECK (status IN ('none', 'pending', 'approved', 'rejected')),
  reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  id_hash TEXT,
  phone_hash TEXT,
  id_image_path TEXT,
  selfie_path TEXT,
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (reason IS NULL OR char_length(reason) <= 500),
  CHECK (id_hash IS NULL OR id_hash ~ '^[0-9a-f]{64}$'),
  CHECK (phone_hash IS NULL OR phone_hash ~ '^[0-9a-f]{64}$'),
  CHECK (id_image_path IS NULL OR id_image_path LIKE user_id::TEXT || '/%'),
  CHECK (selfie_path IS NULL OR selfie_path LIKE user_id::TEXT || '/%'),
  CHECK (
    status NOT IN ('pending', 'approved')
    OR id_hash IS NOT NULL
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS seller_verifications_id_hash_unique
  ON public.seller_verifications (id_hash)
  WHERE id_hash IS NOT NULL;

ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.seller_verifications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.seller_verifications TO authenticated;
GRANT ALL ON public.seller_verifications TO service_role;

DROP POLICY IF EXISTS "Users read their own seller verification" ON public.seller_verifications;
CREATE POLICY "Users read their own seller verification"
  ON public.seller_verifications FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE OR REPLACE VIEW public.public_seller_status AS
SELECT
  p.user_id,
  COALESCE(v.status = 'approved', FALSE) AS is_verified
FROM public.profiles p
LEFT JOIN public.seller_verifications v ON v.user_id = p.user_id;

REVOKE ALL ON public.public_seller_status FROM PUBLIC;
GRANT SELECT ON public.public_seller_status TO anon, authenticated;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS seller_type TEXT;

UPDATE public.listings l
SET seller_type = CASE
  WHEN EXISTS (
    SELECT 1
    FROM public.stores s
    WHERE s.user_id = l.user_id
  ) THEN 'store'
  ELSE 'individual'
END
WHERE l.seller_type IS NULL;

ALTER TABLE public.listings
  ALTER COLUMN seller_type SET DEFAULT 'individual',
  ALTER COLUMN seller_type SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.listings'::regclass
      AND conname = 'listings_seller_type_check'
  ) THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_seller_type_check
      CHECK (seller_type IN ('store', 'individual'));
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.individual_seller_policy (
  singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
  unverified_active_listing_limit INTEGER NOT NULL DEFAULT 3
    CHECK (unverified_active_listing_limit >= 0),
  verified_active_listing_limit INTEGER NOT NULL DEFAULT 10
    CHECK (verified_active_listing_limit >= 0),
  high_risk_categories TEXT[] NOT NULL DEFAULT ARRAY[
    'electronics',
    'phones',
    'mobile phones',
    'electronics & gadgets',
    'vehicles',
    'property',
    'real estate'
  ]::TEXT[],
  phone_otp_required BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.individual_seller_policy (singleton)
VALUES (TRUE)
ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.individual_seller_policy ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.individual_seller_policy FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.individual_seller_policy TO service_role;

CREATE OR REPLACE FUNCTION public.derive_listing_seller_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.seller_type := CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.stores s
      WHERE s.user_id = NEW.user_id
    ) THEN 'store'
    ELSE 'individual'
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS a_derive_listing_seller_type ON public.listings;
CREATE TRIGGER a_derive_listing_seller_type
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.derive_listing_seller_type();

CREATE OR REPLACE FUNCTION public.enforce_individual_seller_listing_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  seller_policy public.individual_seller_policy%ROWTYPE;
  seller_is_verified BOOLEAN;
  active_listing_count INTEGER;
  listing_limit INTEGER;
  has_existing_individual_listing BOOLEAN;
  confirmed_phone_at TIMESTAMPTZ;
BEGIN
  IF NEW.seller_type <> 'individual' THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NOT NULL AND NEW.user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Listings can only be created for the signed-in user';
  END IF;

  SELECT * INTO seller_policy
  FROM public.individual_seller_policy
  WHERE singleton = TRUE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Individual seller policy is not configured';
  END IF;

  SELECT COALESCE(v.status = 'approved', FALSE)
  INTO seller_is_verified
  FROM (SELECT NEW.user_id AS user_id) owner
  LEFT JOIN public.seller_verifications v ON v.user_id = owner.user_id;

  IF EXISTS (
    SELECT 1
    FROM unnest(seller_policy.high_risk_categories) AS high_risk(category)
    WHERE lower(trim(high_risk.category)) = lower(trim(NEW.category))
  ) AND NOT seller_is_verified THEN
    RAISE EXCEPTION 'Identity verification is required before listing in this category';
  END IF;

  IF TG_OP = 'INSERT' AND seller_policy.phone_otp_required THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.user_id = NEW.user_id
        AND l.seller_type = 'individual'
    )
    INTO has_existing_individual_listing;

    IF NOT has_existing_individual_listing THEN
      SELECT u.phone_confirmed_at
      INTO confirmed_phone_at
      FROM auth.users u
      WHERE u.id = NEW.user_id;

      IF confirmed_phone_at IS NULL THEN
        RAISE EXCEPTION 'Verify your phone number before creating your first individual listing';
      END IF;
    END IF;
  END IF;

  IF NEW.moderation_status = 'approved'
     AND lower(COALESCE(NEW.status, 'available')) IN ('available', 'active') THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::TEXT, 0));

    SELECT COUNT(*)::INTEGER
    INTO active_listing_count
    FROM public.listings l
    WHERE l.user_id = NEW.user_id
      AND l.seller_type = 'individual'
      AND l.moderation_status = 'approved'
      AND lower(COALESCE(l.status, 'available')) IN ('available', 'active')
      AND l.id IS DISTINCT FROM NEW.id;

    listing_limit := CASE
      WHEN seller_is_verified THEN seller_policy.verified_active_listing_limit
      ELSE seller_policy.unverified_active_listing_limit
    END;

    IF active_listing_count >= listing_limit THEN
      RAISE EXCEPTION 'This individual seller has reached the active listing limit of %', listing_limit;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_individual_seller_listing_rules ON public.listings;
CREATE TRIGGER enforce_individual_seller_listing_rules
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_individual_seller_listing_rules();
