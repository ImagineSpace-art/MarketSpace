CREATE OR REPLACE FUNCTION public.delete_guest_store_conversation(
  p_conversation_id UUID,
  p_resume_secret TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF COALESCE(p_resume_secret, '') !~ '^[A-Za-z0-9_-]{43}$' THEN
    RAISE EXCEPTION 'This conversation could not be found';
  END IF;

  DELETE FROM public.store_guest_conversations
  WHERE id = p_conversation_id
    AND resume_secret_hash = extensions.digest(p_resume_secret, 'sha256');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'This conversation could not be found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_guest_store_conversation(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_guest_store_conversation(UUID, TEXT) TO anon, authenticated;
