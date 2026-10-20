'use client'

import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { uploadMediaAsset } from '@/actions/media-actions'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
const MAX_BYTES = 10 * 1024 * 1024 // mirrors media-actions image limit; server re-enforces

type Props = {
  projectId: string
  value: string | null
  onChange: (url: string | null) => void
  disabled?: boolean
}

export function TemplateThumbnailUploader ({
  projectId,
  value,
  onChange,
  disabled = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile (file: File) {
    if (!ACCEPTED.includes(file.type)) {
      toast.error('Unsupported image type (use JPG, PNG, WebP, GIF, or SVG)')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image is too large (max 10 MB)')
      return
    }

    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('projectId', projectId)
      const res = await uploadMediaAsset(fd)
      onChange(res.publicUrl)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  function handleDrop (e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    if (disabled || isUploading) return
    const file = e.dataTransfer.files?.[0]
    if (file) void handleFile(file)
  }

  if (value) {
    return (
      <div className="group relative overflow-hidden rounded-lg border bg-muted/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={value}
          alt="Template thumbnail"
          className="aspect-video w-full object-cover"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute end-2 top-2 h-7 gap-1 px-2 text-xs shadow-sm"
          onClick={() => onChange(null)}
          disabled={disabled || isUploading}
        >
          <X className="size-3.5" />
          Remove
        </Button>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && !isUploading && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled && !isUploading) {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        if (!disabled && !isUploading) setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        'flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/20 px-4 text-center transition-colors',
        dragOver && 'border-primary bg-primary/5',
        (disabled || isUploading) && 'cursor-not-allowed opacity-60',
      )}
    >
      {isUploading ? (
        <>
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
          <p className="text-xs text-muted-foreground">Uploading…</p>
        </>
      ) : (
        <>
          <ImagePlus className="size-5 text-muted-foreground" />
          <p className="text-xs font-medium">
            Drag &amp; drop or{' '}
            <span className="text-primary underline-offset-2 hover:underline">
              click to upload
            </span>
          </p>
          <p className="text-[10px] text-muted-foreground">
            PNG, JPG, WebP up to 10 MB. Leave empty to use a live page preview.
          </p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
