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
        const { data, error } = await createClient()
          .storage.from(bucket)
          .upload(fileName, file, { cacheControl: '3600', upsert: false })
        if (error) throw error
        return getPublicUrl(data.path, bucket)
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
