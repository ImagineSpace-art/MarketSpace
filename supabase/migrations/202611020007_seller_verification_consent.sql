ALTER TABLE public.seller_verifications
  ADD COLUMN IF NOT EXISTS consented_at TIMESTAMPTZ;
