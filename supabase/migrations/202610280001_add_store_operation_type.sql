ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS operation_type TEXT DEFAULT 'omnichannel';

NOTIFY pgrst, 'reload schema';
