ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS how_it_works TEXT,
  ADD COLUMN IF NOT EXISTS lowest_acceptable_price NUMERIC,
  ADD COLUMN IF NOT EXISTS delivery_paid_by TEXT DEFAULT 'buyer';
