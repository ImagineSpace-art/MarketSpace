ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "Public read approved stores" ON public.stores;
CREATE POLICY "Public read approved stores"
  ON public.stores FOR SELECT
  USING (
    (status = 'approved' AND archived_at IS NULL)
    OR auth.uid() = user_id
  );

DROP POLICY IF EXISTS "Public Read Listings" ON public.listings;
CREATE POLICY "Public Read Listings" ON public.listings
  FOR SELECT
  USING (
    (
      moderation_status = 'approved'
      AND (
        store_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.stores s
          WHERE s.id = listings.store_id
            AND s.status = 'approved'
            AND s.archived_at IS NULL
        )
      )
    )
    OR auth.uid() = user_id
    OR (
      public.is_moderator()
      AND (
        store_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.stores s
          WHERE s.id = listings.store_id
            AND s.archived_at IS NULL
        )
      )
    )
  );

DROP POLICY IF EXISTS "Approved active ads are public, owners and moderators read all" ON public.store_ads;
CREATE POLICY "Approved active ads are public, owners and moderators read all"
  ON public.store_ads FOR SELECT TO anon, authenticated
  USING (
    (
      moderation_status = 'approved'
      AND status = 'Active'
      AND EXISTS (
        SELECT 1
        FROM public.stores s
        WHERE s.id = store_ads.store_id
          AND s.status = 'approved'
          AND s.archived_at IS NULL
      )
    )
    OR user_id = (SELECT auth.uid())
    OR public.is_moderator()
  );

DROP POLICY IF EXISTS "Ad owners can create their own ads" ON public.store_ads;
CREATE POLICY "Ad owners can create their own ads"
  ON public.store_ads FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id
        AND s.user_id = (SELECT auth.uid())
        AND s.status = 'approved'
        AND s.archived_at IS NULL
    )
  );

CREATE OR REPLACE FUNCTION public.archive_owned_store(p_store_id UUID, p_archived BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  store_row public.stores%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR p_archived IS NULL THEN
    RAISE EXCEPTION 'A signed-in store owner and archive state are required';
  END IF;

  SELECT * INTO store_row
  FROM public.stores
  WHERE id = p_store_id
    AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Store not found for the signed-in user';
  END IF;
  IF store_row.status <> 'approved' THEN
    RAISE EXCEPTION 'Only approved stores can be archived or restored';
  END IF;
  IF (store_row.archived_at IS NOT NULL) = p_archived THEN
    RETURN;
  END IF;

  UPDATE public.stores
  SET archived_at = CASE WHEN p_archived THEN NOW() ELSE NULL END
  WHERE id = p_store_id;
END;
$$;

REVOKE ALL ON FUNCTION public.archive_owned_store(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.archive_owned_store(UUID, BOOLEAN) TO authenticated;

CREATE OR REPLACE FUNCTION public.delete_archived_owned_store(p_store_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  deleted_store_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sign in to permanently delete a store';
  END IF;

  PERFORM 1
  FROM public.stores
  WHERE id = p_store_id
    AND user_id = auth.uid()
    AND archived_at IS NOT NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Archive this store before permanently deleting it';
  END IF;

  DELETE FROM public.listings
  WHERE store_id = p_store_id;

  DELETE FROM public.reviews
  WHERE store_id = p_store_id;

  DELETE FROM public.ad_likes
  WHERE ad_id IN (
    SELECT id FROM public.store_ads WHERE store_id = p_store_id
  );

  DELETE FROM public.ad_comments
  WHERE ad_id IN (
    SELECT id FROM public.store_ads WHERE store_id = p_store_id
  );

  DELETE FROM public.stores
  WHERE id = p_store_id
    AND user_id = auth.uid()
    AND archived_at IS NOT NULL
  RETURNING id INTO deleted_store_id;

  IF deleted_store_id IS NULL THEN
    RAISE EXCEPTION 'Store could not be permanently deleted';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_archived_owned_store(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_archived_owned_store(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.store_can_accept_order(p_store_id UUID, p_order_value NUMERIC)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT status = 'approved'
    AND archived_at IS NULL
    AND (probation_state <> 'probation'
      OR max_order_value_zmw IS NULL
      OR p_order_value <= max_order_value_zmw)
  FROM public.stores
  WHERE id = p_store_id
$$;
