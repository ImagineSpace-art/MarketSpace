CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $outer$
BEGIN
  IF to_regclass('cron.job') IS NOT NULL THEN
    PERFORM cron.unschedule(jobid)
      FROM cron.job
      WHERE jobname = 'marketspace-expire-listings-hourly';

    PERFORM cron.schedule(
      'marketspace-expire-listings-hourly',
      '0 * * * *',
      $job$SELECT public.expire_marketplace_listings()$job$
    );
  END IF;
END;
$outer$;
