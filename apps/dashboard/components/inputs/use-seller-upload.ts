'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { createClient } from '@/supabase/client'
import { generateImageName, getPublicUrl } from '@/lib/utils'
import { THEME_REQUEST_BUCKET } from '@workspace/lib/theme-requests'
import { createProductImageUploadUrl, createSellerUploadUrl, createSellersBucketUploadUrl, createThemeRequestImageUploadUrl } from './seller-upload.server'

const MAX_SIZE = 5 * 1024 * 1024

export const SELLER_IMAGE_ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

export const SELLER_IMAGE_ACCEPT_ATTR = 'image/png,image/jpeg,image/webp'

/**
 * Uploads one file into `<folder>/<sellerId>/` of the public `sellers` bucket
 * through a signed upload URL: the server checks the session and builds the
 * path. The bucket refuses anonymous writes (0152), and the browser has no
 * readable session in production. Resolves to the stored path.
 */
async function uploadToSellersBucket (file: File, folder: string, fileName: string): Promise<string> {
  const signed = await createSellersBucketUploadUrl(folder, fileName)
  if (!signed.success) throw new Error(`upload not signed: ${signed.error}`)
  const { data, error } = await createClient()
    .storage.from('sellers')
    .uploadToSignedUrl(signed.path, signed.token, file, { cacheControl: '31536000', contentType: file.type || undefined })
  if (error) throw error
  return data.path
}

/**
 * Uploads one product photo into `<sellerId>/<YYYY-MM-DD>/` of the public
 * `products` bucket through a signed upload URL (the bucket has no write
 * policies, 0153). Resolves to the stored path (what `products.images`
 * holds); throws on failure.
 */
export async function uploadProductImage (file: File): Promise<string> {
  const fileName = generateImageName(file).split('/').pop() ?? ''
  const signed = await createProductImageUploadUrl(fileName)
  if (!signed.success) throw new Error(`upload not signed: ${signed.error}`)
  const { data, error } = await createClient()
    .storage.from('products')
    .uploadToSignedUrl(signed.path, signed.token, file, { cacheControl: '31536000', contentType: file.type || undefined })
  if (error) throw error
  return data.path
}

/**
 * Uploads one file into the seller's own folder of a private bucket
 * (`store-media`, `store-top-up-proofs`) through a signed upload URL from the
 * server, which checks the session and the path. The browser has no readable
 * session in production (httpOnly cookies), so a plain upload would be `anon`.
 * Resolves to the stored path; throws on failure.
 */
export async function uploadOwnFolderFile (
  file: File,
  { bucket, path, cacheControl = '31536000' }: { bucket: string; path: string; cacheControl?: string }
): Promise<string> {
  const signed = await createSellerUploadUrl(bucket, path)
  if (!signed.success) throw new Error(`upload not signed: ${signed.error}`)
  const { data, error } = await createClient()
    .storage.from(bucket)
    .uploadToSignedUrl(path, signed.token, file, { cacheControl, contentType: file.type || undefined })
  if (error) throw error
  return data.path
}

/**
 * Validates and uploads one seller image (logo, banner, document scan) to the
 * seller's own folder of the `sellers` bucket (`<folder>/<sellerId>/<file>`).
 * Resolves to its public URL, or null after showing an error toast.
 */
export function useSellerUpload ({
  folder,
}: {
  folder: 'logos' | 'banners' | 'documents'
}) {
  const t = useTranslations('inputs.sellerImage')
  const [isUploading, setIsUploading] = useState(false)

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      if (!file.type.startsWith('image/')) {
        toast.error(t('notAnImage'))
        return null
      }
      if (file.size > MAX_SIZE) {
        toast.error(t('tooLarge'))
        return null
      }

      setIsUploading(true)
      try {
        const fileName = generateImageName(file).split('/').pop() ?? ''
        const path = await uploadToSellersBucket(file, folder, fileName)
        return getPublicUrl(path, 'sellers')
      } catch (error) {
        console.error('Seller image upload failed:', error)
        toast.error(t('uploadFailed'))
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [folder, t]
  )

  return { upload, isUploading }
}

/**
 * Uploads one "Request a theme" image (F-77) into the seller's own folder of
 * the private `theme-request-images` bucket through a signed upload URL. The
 * server checks the type and size and builds the path. Resolves to the stored
 * path (what the request saves); throws on failure.
 */
export async function uploadThemeRequestImage (file: File): Promise<string> {
  const signed = await createThemeRequestImageUploadUrl({ type: file.type, size: file.size })
  if (!signed.success) throw new Error(`upload not signed: ${signed.error}`)
  const { data, error } = await createClient()
    .storage.from(THEME_REQUEST_BUCKET)
    .uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type || undefined })
  if (error) throw error
  return data.path
}
