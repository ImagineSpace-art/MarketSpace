ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT user_id, username, avatar_url, created_at, cover_url
  FROM public.profiles;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS template_changed_at TIMESTAMPTZ;

UPDATE public.stores
SET template_changed_at = NOW()
WHERE template_id IS NOT NULL
  AND template_changed_at IS NULL;

CREATE OR REPLACE FUNCTION public.enforce_store_template_change_cooldown()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.template_id IS DISTINCT FROM OLD.template_id THEN
    IF OLD.template_id IS NOT NULL
      AND OLD.template_changed_at IS NOT NULL
      AND OLD.template_changed_at > statement_timestamp() - INTERVAL '6 months'
    THEN
      RAISE EXCEPTION 'Store templates can only be changed once every six months.'
        USING ERRCODE = 'P0001';
    END IF;

    NEW.template_changed_at := statement_timestamp();
  ELSIF NEW.template_changed_at IS DISTINCT FROM OLD.template_changed_at THEN
    RAISE EXCEPTION 'Template change timestamps are managed by the database.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS store_template_change_cooldown ON public.stores;
CREATE TRIGGER store_template_change_cooldown
  BEFORE UPDATE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_store_template_change_cooldown();
