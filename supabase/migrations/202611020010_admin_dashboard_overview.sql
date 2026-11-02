CREATE OR REPLACE FUNCTION public.get_admin_dashboard_overview()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.is_moderator() THEN
    RAISE EXCEPTION 'Only moderators may view platform dashboard metrics';
  END IF;

  RETURN jsonb_build_object(
    'generated_at', NOW(),
    'totals', jsonb_build_object(
      'users', (SELECT COUNT(*) FROM public.profiles),
      'listings', (SELECT COUNT(*) FROM public.listings),
      'active_listings', (
        SELECT COUNT(*) FROM public.listings
        WHERE moderation_status = 'approved'
          AND lower(COALESCE(status, 'available')) IN ('active', 'available')
      ),
      'pending_listings', (
        SELECT COUNT(*) FROM public.listings WHERE moderation_status = 'pending'
      ),
      'stores', (SELECT COUNT(*) FROM public.stores),
      'approved_stores', (
        SELECT COUNT(*) FROM public.stores
        WHERE status = 'approved' AND archived_at IS NULL
      ),
      'pending_store_applications', (
        SELECT COUNT(*) FROM public.stores WHERE status = 'pending_review'
      ),
      'open_reports', (
        SELECT COUNT(*) FROM public.store_reports WHERE status = 'open'
      ),
      'pending_ads', (
        SELECT COUNT(*) FROM public.store_ads WHERE moderation_status = 'pending'
      ),
      'pending_seller_verifications', (
        SELECT COUNT(*) FROM public.seller_verifications WHERE status = 'pending'
      ),
      'events_last_30_days', (
        SELECT COUNT(*) FROM public.analytics_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
      )
    ),
    'trend', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', daily.day::DATE,
          'signups', (
            SELECT COUNT(*) FROM public.profiles p
            WHERE p.created_at >= daily.day
              AND p.created_at < daily.day + INTERVAL '1 day'
          ),
          'listings', (
            SELECT COUNT(*) FROM public.listings l
            WHERE l.created_at >= daily.day
              AND l.created_at < daily.day + INTERVAL '1 day'
          ),
          'views', (
            SELECT COUNT(*) FROM public.analytics_events e
            WHERE e.created_at >= daily.day
              AND e.created_at < daily.day + INTERVAL '1 day'
              AND e.event_type IN ('store_view', 'listing_view')
          ),
          'engagements', (
            SELECT COUNT(*) FROM public.analytics_events e
            WHERE e.created_at >= daily.day
              AND e.created_at < daily.day + INTERVAL '1 day'
              AND e.event_type IN ('listing_click', 'ad_click', 'listing_save', 'listing_share', 'chat_inquiry')
          )
        )
        ORDER BY daily.day
      )
      FROM generate_series(
        CURRENT_DATE - INTERVAL '13 days',
        CURRENT_DATE,
        INTERVAL '1 day'
      ) AS daily(day)
    ), '[]'::JSONB)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_dashboard_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_overview() TO authenticated;
