ALTER TABLE public.seller_verifications
  ADD COLUMN IF NOT EXISTS retained_image_paths TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS images_purged_at TIMESTAMPTZ;

DROP POLICY IF EXISTS "Owners delete unsubmitted seller verification images" ON storage.objects;
CREATE POLICY "Owners delete unsubmitted seller verification images"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'store-private'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND name LIKE (auth.uid()::TEXT || '/seller-verification/%')
    AND NOT EXISTS (
      SELECT 1
      FROM public.seller_verifications verification
      WHERE verification.user_id = auth.uid()
        AND (
          verification.id_image_path = name
          OR verification.selfie_path = name
          OR name = ANY(verification.retained_image_paths)
        )
    )
  );
