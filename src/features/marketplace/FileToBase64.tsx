import { uploadImageToSupabase } from './ImageUploader'

export { uploadImageToSupabase }

export async function fileToBase64Compressed(file: File): Promise<string> {
    return uploadImageToSupabase(file, 'marketspace-media', 'uploads')
}