ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS collection_ids JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.listings
SET collection_ids = jsonb_build_array(collection_id)
WHERE collection_id IS NOT NULL
  AND collection_id <> ''
  AND collection_ids = '[]'::jsonb;

ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_collection_ids_array_check;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_collection_ids_array_check
  CHECK (jsonb_typeof(collection_ids) = 'array');

CREATE INDEX IF NOT EXISTS listings_collection_ids_idx
  ON public.listings USING GIN (collection_ids);
