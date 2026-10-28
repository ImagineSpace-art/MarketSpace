import { supabase } from '../../lib/supabaseClient'

/**
 * 1. Client-Side Image Compression & Conversion (Bandwidth Saver)
 * Intercepts selected image files, downscales to max 1200px dimension maintaining aspect ratio,
 * and converts to compressed .webp Blob format (~80% quality, shrinking 5MB images to ~100-200KB).
 */
export function compressImageToWebp(
  file: File,
  maxDimension = 1200,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.src = objectUrl
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('WebP Blob conversion failed'))
          }
        },
        'image/webp',
        quality
      )
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl)
      reject(err)
    }
  })
}

/**
 * Client-side WebP Data URL fallback
 */
export function compressImageToWebpDataUrl(
  file: File,
  maxDimension = 1200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.src = objectUrl
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement('canvas')
      let { width, height } = img

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/webp', quality))
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl)
      reject(err)
    }
  })
}

/**
 * 2. Supabase Storage Bucket Upload & Public CDN URL Retrieval
 * Sends compressed .webp binary Blob to Supabase Storage bucket ('marketspace-media')
 * and returns the public CDN URL for PostgreSQL database storage.
 */
export async function uploadImageToSupabase(
  file: File,
  bucketName = 'marketspace-media',
  folder = 'uploads'
): Promise<string> {
  try {
    // 1. Client-side compression to WebP Blob (max 1200px, 80% quality)
    const webpBlob = await compressImageToWebp(file, 1200, 0.8)
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.webp`

    // 2. Upload WebP binary Blob to Supabase Storage Bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, webpBlob, {
        contentType: 'image/webp',
        upsert: true,
      })

    if (uploadError) {
      console.warn('Supabase storage upload notice (falling back to WebP data url):', uploadError.message)
      return await compressImageToWebpDataUrl(file, 1200, 0.8)
    }

    // 3. Retrieve public CDN URL
    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(uploadData.path)
    return publicUrlData.publicUrl
  } catch (err) {
    console.error('Image upload failed, using WebP fallback:', err)
    return await compressImageToWebpDataUrl(file, 1200, 0.8)
  }
}
