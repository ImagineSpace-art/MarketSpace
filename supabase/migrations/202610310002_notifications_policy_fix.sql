-- Notifications: close a hole found while reviewing live policies. Safe to re-run.
--
-- The old UPDATE policy allowed anyone (including signed-out visitors) to update
-- rows where user_id IS NULL, i.e. the broadcast notifications every user sees.
-- It had no column limit, so title, body and link_url of a broadcast could be
-- rewritten (for example to point at a phishing link).
--
-- After this: a signed-in user may update only their own rows, and only the
-- `unread` column. Broadcast rows can be changed only by trusted roles.

DROP POLICY IF EXISTS "User Update Notifications" ON public.notifications;
DROP POLICY IF EXISTS "User Update Own Notifications" ON public.notifications;

CREATE POLICY "User Update Own Notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

REVOKE UPDATE ON public.notifications FROM anon, authenticated;
GRANT UPDATE (unread) ON public.notifications TO authenticated;

-- Reading stays as it was: own notifications plus broadcasts.
