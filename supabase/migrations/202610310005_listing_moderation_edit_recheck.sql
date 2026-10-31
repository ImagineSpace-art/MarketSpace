CREATE OR REPLACE FUNCTION public.protect_listing_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  assigned_store_id UUID;
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Listings can only be created for the signed-in user';
    END IF;

    SELECT s.id
      INTO assigned_store_id
      FROM public.stores s
      WHERE s.user_id = auth.uid()
        AND s.status = 'approved'
      LIMIT 1;

    NEW.store_id := assigned_store_id;
    NEW.sponsored := FALSE;
    NEW.moderation_status := 'pending';
    NEW.moderation_reason := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;

    IF assigned_store_id IS NOT NULL
       AND NOT public.listing_requires_moderation(auth.uid(), assigned_store_id) THEN
      NEW.moderation_status := 'approved';
    END IF;
    RETURN NEW;
  END IF;

  IF public.is_moderator() THEN
    RETURN NEW;
  END IF;

  IF NEW.store_id IS DISTINCT FROM OLD.store_id
     OR NEW.sponsored IS DISTINCT FROM OLD.sponsored THEN
    RAISE EXCEPTION 'Listing store assignment and sponsorship can only be changed by trusted services';
  END IF;

  IF NEW.moderation_status IS DISTINCT FROM OLD.moderation_status
     OR NEW.moderation_reason IS DISTINCT FROM OLD.moderation_reason
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at THEN
    RAISE EXCEPTION 'Listing moderation fields can only be changed by moderators';
  END IF;

  IF OLD.moderation_status IN ('approved', 'rejected')
     AND (
       NEW.title IS DISTINCT FROM OLD.title
       OR NEW.description IS DISTINCT FROM OLD.description
       OR NEW.price IS DISTINCT FROM OLD.price
       OR NEW.category IS DISTINCT FROM OLD.category
       OR NEW.images IS DISTINCT FROM OLD.images
       OR NEW.listing_type IS DISTINCT FROM OLD.listing_type
     ) THEN
    NEW.moderation_reason := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_at := NULL;
    IF public.listing_requires_moderation(NEW.user_id, NEW.store_id) THEN
      NEW.moderation_status := 'pending';
    ELSIF OLD.moderation_status = 'rejected' THEN
      NEW.moderation_status := 'approved';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
