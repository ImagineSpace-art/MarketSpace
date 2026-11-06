ALTER TABLE public.store_policy_acceptances
  DROP COLUMN IF EXISTS returns_version;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.store_policy_acceptances'::regclass
      AND conname = 'store_policy_acceptances_store_terms_prohibited_key'
  ) THEN
    ALTER TABLE public.store_policy_acceptances
      ADD CONSTRAINT store_policy_acceptances_store_terms_prohibited_key
      UNIQUE (store_id, terms_version, prohibited_items_version);
  END IF;
END
$$;
