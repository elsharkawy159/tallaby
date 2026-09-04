'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Camera, ImageIcon, LoaderCircle, Trash2, Upload } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { createClient } from '@/supabase/client'
import { cn, generateImageName, getPublicUrl } from '@/lib/utils'
import { Button } from '@workspace/ui/components/button'

const MAX_SIZE = 5 * 1024 * 1024
const ACCEPTED = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
}

interface SellerImageUploadProps {
  value?: string | null
  onChange: (url: string) => void
  bucket?: string
  variant?: 'logo' | 'banner' | 'document'
  disabled?: boolean
  className?: string
  label?: string
  /** Skip success toast (parent handles feedback). */
  quiet?: boolean
}

export function SellerImageUpload ({
  value,
  onChange,
  bucket = 'sellers',
  variant = 'logo',
  disabled = false,
  className,
  label,
  quiet = false,
}: SellerImageUploadProps) {
  const supabase = createClient()
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const previewRef = useRef<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  // Drop local blob preview once the parent value catches up
  useEffect(() => {
    if (value && previewRef.current) {
      if (previewRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(previewRef.current)
      }
      previewRef.current = null
      setPreview(null)
    }
  }, [value])

  const displaySrc = preview || (value ? getPublicUrl(value, bucket) : '')

  const clearPreview = () => {
    if (previewRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(previewRef.current)
    }
    previewRef.current = null
    setPreview(null)
  }

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (PNG, JPG, or WebP)')
        return
      }
      if (file.size > MAX_SIZE) {
        toast.error('Image must be 5MB or smaller')
        return
      }

      const objectUrl = URL.createObjectURL(file)
      if (previewRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(previewRef.current)
      }
      previewRef.current = objectUrl
      setPreview(objectUrl)
      setIsUploading(true)

      try {
        const folder =
          variant === 'logo'
            ? 'logos'
            : variant === 'banner'
              ? 'banners'
              : 'documents'
        const fileName = `${folder}/${generateImageName(file).split('/').pop()}`

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (error) throw error

        const publicUrl = getPublicUrl(data.path, bucket)
        onChange(publicUrl)
        // Document slots stay uncontrolled (value=null); reset the preview.
        // Logo/banner keep the blob until the form value updates.
        if (variant === 'document') {
          clearPreview()
        }
        if (!quiet) {
          toast.success(
            variant === 'document' ? 'Document uploaded' : 'Image uploaded'
          )
        }
      } catch (error) {
        console.error('Seller image upload failed:', error)
        toast.error('Failed to upload image')
        clearPreview()
      } finally {
        setIsUploading(false)
      }
    },
    [bucket, onChange, quiet, supabase, variant]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) void uploadFile(file)
    },
    [uploadFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED,
    multiple: false,
    disabled: disabled || isUploading,
    onDrop,
    maxFiles: 1,
  })

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    clearPreview()
    onChange('')
  }

  const isLogo = variant === 'logo'
  const isBanner = variant === 'banner'

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <p className='text-sm font-medium text-foreground'>{label}</p>
      ) : null}

      <div
        {...getRootProps()}
        className={cn(
          'group relative overflow-hidden border-2 border-dashed transition-all',
          isLogo && 'mx-auto size-28 rounded-full',
          isBanner && 'h-36 w-full rounded-xl',
          variant === 'document' && 'h-32 w-full rounded-xl',
          disabled || isUploading
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:border-primary/50 hover:bg-muted/40',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 bg-muted/20'
        )}
      >
        <input {...getInputProps()} />

        {displaySrc ? (
          <>
            <Image
              src={displaySrc}
              alt={label || variant}
              fill
              className={cn(
                'object-cover',
                isLogo && 'rounded-full',
                !isLogo && 'rounded-xl'
              )}
              sizes={isLogo ? '112px' : '(max-width: 768px) 100vw, 480px'}
              unoptimized={displaySrc.startsWith('blob:')}
            />
            {!disabled && !isUploading && (
              <div
                className={cn(
                  'absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100',
                  isLogo && 'rounded-full',
                  !isLogo && 'rounded-xl'
                )}
              >
                <Camera className='size-5 text-white' />
                <span className='text-xs font-medium text-white'>Change</span>
              </div>
            )}
            {!disabled && (
              <Button
                type='button'
                variant='destructive'
                size='icon'
                className='absolute top-1.5 right-1.5 size-7 rounded-full opacity-90 shadow-sm'
                onClick={handleRemove}
                aria-label='Remove image'
              >
                <Trash2 className='size-3.5' />
              </Button>
            )}
          </>
        ) : (
          <div className='flex h-full flex-col items-center justify-center gap-1.5 px-3 text-center'>
            {isUploading ? (
              <LoaderCircle className='size-6 animate-spin text-muted-foreground' />
            ) : (
              <>
                {isLogo ? (
                  <Camera className='size-6 text-muted-foreground' />
                ) : isBanner ? (
                  <ImageIcon className='size-6 text-muted-foreground' />
                ) : (
                  <Upload className='size-6 text-muted-foreground' />
                )}
                <span className='text-xs font-medium text-muted-foreground'>
                  {isDragActive ? 'Drop image' : 'Upload'}
                </span>
                <span className='text-[10px] text-muted-foreground/80'>
                  PNG, JPG, WebP · max 5MB
                </span>
              </>
            )}
          </div>
        )}

        {isUploading && displaySrc ? (
          <div
            className={cn(
              'absolute inset-0 flex items-center justify-center bg-black/40',
              isLogo && 'rounded-full',
              !isLogo && 'rounded-xl'
            )}
          >
            <LoaderCircle className='size-6 animate-spin text-white' />
          </div>
        ) : null}
      </div>
    </div>
  )
}
