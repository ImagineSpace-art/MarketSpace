-- Database-side input limits. The forms check these in the browser, but a request can
-- bypass the browser, so the database enforces the same rules.
-- NOT VALID applies each rule to new and changed rows without failing on old data.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'listings_title_length_check') THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_title_length_check
      CHECK (char_length(btrim(title)) BETWEEN 1 AND 120) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'listings_description_length_check') THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_description_length_check
      CHECK (description IS NULL OR char_length(description) <= 5000) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'listings_price_range_check') THEN
    ALTER TABLE public.listings
      ADD CONSTRAINT listings_price_range_check
      CHECK (price IS NULL OR (price >= 0 AND price <= 1000000000)) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_content_length_check') THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT messages_content_length_check
      CHECK (char_length(btrim(content)) BETWEEN 1 AND 5000) NOT VALID;
  END IF;
END $$;
