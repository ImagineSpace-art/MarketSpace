const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024

export async function makeMetadataFreeImage(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.')
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Images must be 8 MB or smaller.')
  }

  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('This browser cannot process the selected image.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result)
        else reject(new Error('The selected image could not be processed.'))
      }, 'image/jpeg', 0.88)
    })
    if (blob.size > MAX_IMAGE_SIZE_BYTES) throw new Error('Processed image exceeds the 8 MB limit.')
    return blob
  } finally {
    bitmap.close()
  }
}
