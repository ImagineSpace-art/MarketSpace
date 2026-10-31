CREATE TABLE IF NOT EXISTS public.notification_user_states (
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  unread_override BOOLEAN,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (notification_id, user_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.notification_user_states'::regclass
      AND conname = 'notification_user_states_pinned_not_deleted_check'
  ) THEN
    ALTER TABLE public.notification_user_states
      ADD CONSTRAINT notification_user_states_pinned_not_deleted_check
      CHECK (NOT (is_pinned AND is_deleted));
  END IF;
END;
$$;

ALTER TABLE public.notification_user_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their notification states" ON public.notification_user_states;
CREATE POLICY "Users read their notification states"
  ON public.notification_user_states FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users create notification states" ON public.notification_user_states;
CREATE POLICY "Users create notification states"
  ON public.notification_user_states FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND is_deleted = false
    AND EXISTS (
      SELECT 1 FROM public.notifications n
      WHERE n.id = notification_id
        AND (n.user_id IS NULL OR n.user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users update notification states" ON public.notification_user_states;
CREATE POLICY "Users update notification states"
  ON public.notification_user_states FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND is_deleted = false);

REVOKE ALL ON public.notification_user_states FROM PUBLIC, anon;
REVOKE ALL ON public.notification_user_states FROM authenticated;
GRANT SELECT ON public.notification_user_states TO authenticated;
GRANT INSERT (notification_id, user_id, is_pinned, unread_override, updated_at)
  ON public.notification_user_states TO authenticated;
GRANT UPDATE (is_pinned, unread_override, updated_at)
  ON public.notification_user_states TO authenticated;
GRANT ALL ON public.notification_user_states TO service_role;

CREATE OR REPLACE FUNCTION public.delete_notification_for_user(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_id UUID := (SELECT auth.uid());
  notification_owner UUID;
  pinned BOOLEAN;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to delete notifications';
  END IF;

  SELECT n.user_id
    INTO notification_owner
    FROM public.notifications n
    WHERE n.id = p_notification_id
    FOR UPDATE;
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF notification_owner IS NOT NULL AND notification_owner <> caller_id THEN
    RAISE EXCEPTION 'You cannot delete another user''s notification';
  END IF;

  SELECT s.is_pinned INTO pinned
  FROM public.notification_user_states s
  WHERE s.notification_id = p_notification_id
    AND s.user_id = caller_id
  FOR UPDATE;
  IF COALESCE(pinned, false) THEN
    RETURN false;
  END IF;

  IF notification_owner = caller_id THEN
    DELETE FROM public.notifications WHERE id = p_notification_id;
  ELSE
    INSERT INTO public.notification_user_states (
      notification_id, user_id, is_deleted, updated_at
    )
    VALUES (p_notification_id, caller_id, true, NOW())
    ON CONFLICT (notification_id, user_id)
    DO UPDATE SET is_deleted = true, updated_at = NOW();
  END IF;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_notification_for_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_notification_for_user(UUID) TO authenticated;

REVOKE INSERT ON public.notifications FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.send_moderator_notification(
  p_title TEXT,
  p_body TEXT,
  p_link_url TEXT DEFAULT NULL,
  p_user_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  caller_id UUID := (SELECT auth.uid());
  recipient_count INTEGER;
BEGIN
  IF caller_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.store_admins WHERE user_id = caller_id
  ) THEN
    RAISE EXCEPTION 'Only moderators may send notifications';
  END IF;

  IF NULLIF(BTRIM(p_title), '') IS NULL OR CHAR_LENGTH(BTRIM(p_title)) > 120 THEN
    RAISE EXCEPTION 'Notification title must be between 1 and 120 characters';
  END IF;
  IF NULLIF(BTRIM(p_body), '') IS NULL OR CHAR_LENGTH(BTRIM(p_body)) > 2000 THEN
    RAISE EXCEPTION 'Notification message must be between 1 and 2000 characters';
  END IF;
  IF p_link_url IS NOT NULL AND (
    CHAR_LENGTH(p_link_url) > 2048
    OR p_link_url !~* '^(https?://|/|#)'
  ) THEN
    RAISE EXCEPTION 'Notification link must be an HTTP(S) URL or a relative path';
  END IF;

  IF p_user_ids IS NULL THEN
    INSERT INTO public.notifications (user_id, title, body, link_url)
    VALUES (NULL, BTRIM(p_title), BTRIM(p_body), NULLIF(BTRIM(p_link_url), ''));
    RETURN 1;
  END IF;

  IF CARDINALITY(p_user_ids) < 1 OR CARDINALITY(p_user_ids) > 500
    OR array_position(p_user_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Select between 1 and 500 valid recipients';
  END IF;

  SELECT COUNT(DISTINCT requested.user_id)::INTEGER
  INTO recipient_count
  FROM UNNEST(p_user_ids) AS requested(user_id)
  JOIN public.profiles profile ON profile.user_id = requested.user_id;

  IF recipient_count <> (SELECT COUNT(DISTINCT user_id) FROM UNNEST(p_user_ids) AS requested(user_id)) THEN
    RAISE EXCEPTION 'One or more notification recipients do not exist';
  END IF;

  INSERT INTO public.notifications (user_id, title, body, link_url)
  SELECT DISTINCT requested.user_id, BTRIM(p_title), BTRIM(p_body), NULLIF(BTRIM(p_link_url), '')
  FROM UNNEST(p_user_ids) AS requested(user_id);

  RETURN recipient_count;
END;
$$;

REVOKE ALL ON FUNCTION public.send_moderator_notification(TEXT, TEXT, TEXT, UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_moderator_notification(TEXT, TEXT, TEXT, UUID[]) TO authenticated;

ALTER TABLE public.chat_user_states
  ADD COLUMN IF NOT EXISTS is_unread BOOLEAN NOT NULL DEFAULT false;

UPDATE public.chat_user_states
SET is_pinned = false
WHERE is_deleted AND is_pinned;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.chat_user_states'::regclass
      AND conname = 'chat_user_states_pinned_not_deleted_check'
  ) THEN
    ALTER TABLE public.chat_user_states
      ADD CONSTRAINT chat_user_states_pinned_not_deleted_check
      CHECK (NOT (is_pinned AND is_deleted));
  END IF;
END;
$$;
