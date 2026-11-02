CREATE OR REPLACE FUNCTION public.end_unavailable_visibility_boosts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_type TEXT;
  v_target_key TEXT;
BEGIN
  v_target_type := CASE TG_TABLE_NAME
    WHEN 'listings' THEN 'listing'
    WHEN 'store_ads' THEN 'ad'
    ELSE 'store'
  END;
  v_target_key := CASE TG_TABLE_NAME
    WHEN 'listings' THEN NEW.id::TEXT
    WHEN 'store_ads' THEN NEW.id::TEXT
    ELSE NEW.id::TEXT
  END;

  IF TG_TABLE_NAME = 'stores' THEN
    UPDATE public.boosts b
    SET status = 'ended', end_reason = 'target_unavailable'
    WHERE b.status = 'active'
      AND (
        (b.target_type = 'store' AND b.target_id = v_target_key)
        OR (b.target_type = 'listing' AND EXISTS (
          SELECT 1 FROM public.listings l WHERE l.id::TEXT = b.target_id AND l.store_id::TEXT = v_target_key
        ))
        OR (b.target_type = 'ad' AND EXISTS (
          SELECT 1 FROM public.store_ads a WHERE a.id = b.target_id AND a.store_id::TEXT = v_target_key
        ))
      )
      AND NOT public.boost_target_is_eligible(b.target_type, b.target_id);
  ELSIF NOT public.boost_target_is_eligible(v_target_type, v_target_key) THEN
    UPDATE public.boosts
    SET status = 'ended', end_reason = 'target_unavailable'
    WHERE boosts.target_type = v_target_type
      AND boosts.target_id = v_target_key AND boosts.status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.end_deleted_visibility_boosts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_target_type TEXT;
  v_target_key TEXT;
BEGIN
  v_target_type := CASE TG_TABLE_NAME
    WHEN 'listings' THEN 'listing'
    WHEN 'store_ads' THEN 'ad'
    ELSE 'store'
  END;
  v_target_key := CASE TG_TABLE_NAME
    WHEN 'listings' THEN OLD.id::TEXT
    WHEN 'store_ads' THEN OLD.id::TEXT
    ELSE OLD.id::TEXT
  END;

  UPDATE public.boosts b
  SET status = 'ended', end_reason = 'target_unavailable'
  WHERE b.status = 'active'
    AND (
      (b.target_type = v_target_type AND b.target_id = v_target_key)
      OR (TG_TABLE_NAME = 'stores' AND b.target_type = 'listing' AND EXISTS (
        SELECT 1 FROM public.listings l WHERE l.id::TEXT = b.target_id AND l.store_id::TEXT = v_target_key
      ))
      OR (TG_TABLE_NAME = 'stores' AND b.target_type = 'ad' AND EXISTS (
        SELECT 1 FROM public.store_ads a WHERE a.id = b.target_id AND a.store_id::TEXT = v_target_key
      ))
    );
  RETURN OLD;
END;
$$;
