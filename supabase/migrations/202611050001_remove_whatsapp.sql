UPDATE public.stores
SET customer_care = COALESCE(customer_care, '{}'::jsonb)
  || jsonb_build_object('phone', NULLIF(BTRIM(whatsapp), ''))
WHERE NULLIF(BTRIM(whatsapp), '') IS NOT NULL
  AND NULLIF(BTRIM(customer_care ->> 'phone'), '') IS NULL;

UPDATE public.stores
SET template_content = jsonb_set(
  jsonb_set(
    template_content,
    '{boutique-grid}',
    COALESCE(template_content -> 'boutique-grid', '{}'::jsonb) - 'whatsappNumber',
    false
  ),
  '{storefront-landing}',
  COALESCE(template_content -> 'storefront-landing', '{}'::jsonb) - 'whatsappNumber',
  false
)
WHERE jsonb_typeof(template_content) = 'object'
  AND (
    template_content -> 'boutique-grid' ? 'whatsappNumber'
    OR template_content -> 'storefront-landing' ? 'whatsappNumber'
  );

UPDATE public.stores
SET ads = COALESCE((
  SELECT jsonb_agg(
    (ad - 'contactPhone' - 'whatsapp')
    || CASE
      WHEN LOWER(ad ->> 'contactMethod') = 'whatsapp'
        THEN jsonb_build_object('contactMethod', 'messenger')
      ELSE '{}'::jsonb
    END
  )
  FROM jsonb_array_elements(ads) AS items(ad)
), '[]'::jsonb)
WHERE jsonb_typeof(ads) = 'array';

UPDATE public.store_ads
SET ad_data = (ad_data - 'contactPhone' - 'whatsapp')
  || CASE
    WHEN LOWER(ad_data ->> 'contactMethod') = 'whatsapp'
      THEN jsonb_build_object('contactMethod', 'messenger')
    ELSE '{}'::jsonb
  END;

ALTER TABLE public.stores
  DROP COLUMN IF EXISTS whatsapp;
