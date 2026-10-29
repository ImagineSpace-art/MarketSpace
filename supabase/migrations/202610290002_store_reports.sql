CREATE TABLE IF NOT EXISTS public.store_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'scam_or_fake_store',
    'prohibited_items',
    'misleading_information',
    'impersonation',
    'other'
  )),
  details TEXT NOT NULL DEFAULT '' CHECK (char_length(details) <= 500),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'upheld')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS store_reports_open_store_created_idx
  ON public.store_reports (store_id, created_at)
  WHERE status = 'open';

CREATE UNIQUE INDEX IF NOT EXISTS store_reports_one_open_per_store_reporter_idx
  ON public.store_reports (store_id, reporter_id)
  WHERE status = 'open';

ALTER TABLE public.store_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users create reports as themselves" ON public.store_reports;
CREATE POLICY "Users create reports as themselves"
  ON public.store_reports FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = (SELECT auth.uid())
    AND status = 'open'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.stores
      WHERE id = store_id
        AND status = 'approved'
        AND user_id IS DISTINCT FROM (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Moderators read store reports" ON public.store_reports;
CREATE POLICY "Moderators read store reports"
  ON public.store_reports FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.store_admins WHERE user_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS "Moderators update store reports" ON public.store_reports;

REVOKE ALL ON public.store_reports FROM PUBLIC, anon;
REVOKE ALL ON public.store_reports FROM authenticated;
GRANT INSERT (store_id, reporter_id, reason, details) ON public.store_reports TO authenticated;
GRANT SELECT ON public.store_reports TO authenticated;
GRANT ALL ON public.store_reports TO service_role;

CREATE OR REPLACE FUNCTION public.review_store_report(
  p_report_id UUID,
  p_reviewer_id UUID,
  p_status TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewed_store_id UUID;
BEGIN
  IF p_status NOT IN ('dismissed', 'upheld') THEN
    RAISE EXCEPTION 'Invalid store report decision';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.store_admins WHERE user_id = p_reviewer_id) THEN
    RAISE EXCEPTION 'Reviewer is not a store moderator';
  END IF;

  UPDATE public.store_reports
  SET status = p_status,
      reviewed_by = p_reviewer_id,
      reviewed_at = NOW()
  WHERE id = p_report_id
    AND status = 'open'
  RETURNING store_id INTO reviewed_store_id;

  IF reviewed_store_id IS NULL THEN
    RAISE EXCEPTION 'Store report is no longer open';
  END IF;

  INSERT INTO public.store_review_audit_log (
    store_id,
    actor_user_id,
    action,
    details
  )
  VALUES (
    reviewed_store_id,
    p_reviewer_id,
    'store_report_' || p_status,
    jsonb_build_object('report_id', p_report_id, 'status', p_status)
  );

  RETURN reviewed_store_id;
END;
$$;

REVOKE ALL ON FUNCTION public.review_store_report(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.review_store_report(UUID, UUID, TEXT) TO service_role;
