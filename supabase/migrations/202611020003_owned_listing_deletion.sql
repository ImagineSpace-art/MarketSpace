CREATE OR REPLACE FUNCTION public.delete_owned_listing(p_listing_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to delete a listing';
  END IF;

  DELETE FROM public.listings
  WHERE id = p_listing_id
    AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found for the signed-in user';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_owned_listing(BIGINT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_owned_listing(BIGINT) TO authenticated;
