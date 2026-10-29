import { supabase } from '../../lib/supabaseClient'
import { compressImageToWebp } from '../marketplace/ImageUploader'
import {
  MAX_STORE_ASSET_BYTES,
  STORE_ASSETS_BUCKET,
  STORE_ASSET_MAX_DIMENSION,
} from '../../../supabase/functions/_shared/storeTemplateSchema'

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function uploadStoreTemplateImage(file: File): Promise<string> {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.')
  }
  if (file.size > MAX_STORE_ASSET_BYTES) {
    throw new Error('Store images must be 5 MB or smaller.')
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) throw new Error(`Could not verify your session: ${sessionError.message}`)
  const userId = sessionData.session?.user.id
  if (!userId) throw new Error('Sign in before uploading a store image.')

  const compressedImage = await compressImageToWebp(file, STORE_ASSET_MAX_DIMENSION, 0.82)
  if (compressedImage.size > MAX_STORE_ASSET_BYTES) {
    throw new Error('The compressed image exceeds the 5 MB storage limit.')
  }

  const path = `${userId}/${crypto.randomUUID()}.webp`
  const { data, error } = await supabase.storage
    .from(STORE_ASSETS_BUCKET)
    .upload(path, compressedImage, { contentType: 'image/webp', upsert: false })
  if (error) throw new Error(`Store image upload failed: ${error.message}`)
  return data.path
}

export function getStoreTemplateImageUrl(path: string) {
  return supabase.storage.from(STORE_ASSETS_BUCKET).getPublicUrl(path).data.publicUrl
}
