'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'

import { createClient } from '@/supabase/client'
import { generateImageName, getPublicUrl } from '@/lib/utils'

const MAX_SIZE = 5 * 1024 * 1024

export const SELLER_IMAGE_ACCEPT = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

export const SELLER_IMAGE_ACCEPT_ATTR = 'image/png,image/jpeg,image/webp'

/**
 * Uploads one file from the browser with the seller's own session, so the
 * bucket's Storage policies apply (e.g. `store-media` only accepts paths
 * under '{auth.uid()}/'). Resolves to the stored path; throws on failure.
 */
export async function uploadSellerFile (
  file: File,
  { bucket, path, cacheControl = '3600' }: { bucket: string; path: string; cacheControl?: string }
): Promise<string> {
  const { data, error } = await createClient()
    .storage.from(bucket)
    .upload(path, file, { cacheControl, upsert: false, contentType: file.type || undefined })
  if (error) throw error
  return data.path
}

/**
 * Validates and uploads one seller image (logo, banner, document scan) to
 * storage. Resolves to its public URL, or null after showing an error toast.
 */
export function useSellerUpload ({
  folder,
  bucket = 'sellers',
}: {
  folder: 'logos' | 'banners' | 'documents'
  bucket?: string
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
        const fileName = `${folder}/${generateImageName(file).split('/').pop()}`
        const path = await uploadSellerFile(file, { bucket, path: fileName })
        return getPublicUrl(path, bucket)
      } catch (error) {
        console.error('Seller image upload failed:', error)
        toast.error(t('uploadFailed'))
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [bucket, folder, t]
  )

  return { upload, isUploading }
}
