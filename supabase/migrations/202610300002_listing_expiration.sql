-- Server-side renewal expiration enforcement.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS global_renewal_frequency TEXT NOT NULL DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS global_renewal_day TEXT NOT NULL DEFAULT 'Monday',
  ADD COLUMN IF NOT EXISTS enable_global_renewal BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS renewal_frequency TEXT NOT NULL DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS use_global_renewal BOOLEAN NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.listing_is_expired(p_listing public.listings)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_base timestamptz := COALESCE(p_listing.last_renewed_at, p_listing.created_at, now());
  v_frequency text;
  v_global_day text := 'Monday';
  v_days integer;
  v_profile_id uuid;
BEGIN
  IF COALESCE(p_listing.use_global_renewal, true) THEN
    v_profile_id := p_listing.user_id;
    SELECT COALESCE(global_renewal_frequency, 'weekly'), COALESCE(global_renewal_day, 'Monday')
      INTO v_frequency, v_global_day
      FROM public.profiles
      WHERE user_id = v_profile_id;
    v_frequency := COALESCE(v_frequency, 'weekly');
  ELSE
    v_frequency := COALESCE(p_listing.renewal_frequency, 'weekly');
  END IF;

  v_days := CASE v_frequency
    WHEN 'daily' THEN 1
    WHEN 'biweekly' THEN 14
    WHEN 'monthly' THEN 30
    ELSE 7
  END;

  IF now() >= v_base + make_interval(days => v_days) THEN
    RETURN true;
  END IF;

  IF COALESCE(p_listing.use_global_renewal, true)
     AND v_frequency IN ('weekly', 'biweekly')
     AND now() >= v_base + interval '1 day'
     AND trim(to_char(now() AT TIME ZONE 'UTC', 'Day')) = v_global_day THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_marketplace_listings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  UPDATE public.listings l
  SET status = 'Expired'
  WHERE COALESCE(l.status, 'Available') <> 'Expired'
    AND public.listing_is_expired(l)
    AND lower(COALESCE(l.status, '')) NOT IN ('sold', 'deleted');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_listing_expiration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.listing_is_expired(NEW)
     AND lower(COALESCE(NEW.status, '')) NOT IN ('sold', 'deleted') THEN
    NEW.status := 'Expired';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_listing_expiration ON public.listings;
CREATE TRIGGER enforce_listing_expiration
BEFORE INSERT OR UPDATE OF status, last_renewed_at, created_at, renewal_frequency, use_global_renewal, user_id
ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_expiration();

SELECT public.expire_marketplace_listings();

DO $outer$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    PERFORM cron.unschedule(jobid)
      FROM cron.job
      WHERE jobname = 'marketspace-expire-listings-hourly';
    PERFORM cron.schedule(
      'marketspace-expire-listings-hourly',
      '0 * * * *',
      $job$SELECT public.expire_marketplace_listings()$job$
    );
  END IF;
END;
$outer$;

GRANT EXECUTE ON FUNCTION public.expire_marketplace_listings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.listing_is_expired(public.listings) TO authenticated, anon;
