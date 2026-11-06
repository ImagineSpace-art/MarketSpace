ALTER TABLE public.store_registration_drafts
  DROP COLUMN IF EXISTS location_code_hash,
  DROP COLUMN IF EXISTS location_code_text,
  DROP COLUMN IF EXISTS location_code_expires_at;

ALTER TABLE public.store_location_verifications
  DROP COLUMN IF EXISTS code_hash,
  DROP COLUMN IF EXISTS code_text,
  DROP COLUMN IF EXISTS code_expires_at;
