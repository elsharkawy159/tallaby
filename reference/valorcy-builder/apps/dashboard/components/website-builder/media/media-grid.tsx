'use client'

import { useState, useTransition } from 'react'
import { ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@workspace/ui/lib/utils'
import { deleteMediaAsset } from '@/actions/media-actions'

export interface MediaAsset {
  id: string
  publicUrl: string
  filename: string
}

export interface MediaGridProps {
  assets: MediaAsset[]
  selectedUrl?: string
  onSelect: (url: string) => void
  onRemove: (id: string) => void
}

function MediaCard ({
  asset,
  isSelected,
  onSelect,
  onRemove,
}: {
  asset: MediaAsset
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const [isPending, startTransition] = useTransition()

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    startTransition(async () => {
      try {
        await deleteMediaAsset(asset.id)
        onRemove()
        toast.success('Image removed.')
      } catch {
        toast.error('Failed to remove image.')
      }
    })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      className={cn(
        'group relative flex cursor-pointer flex-col gap-1 rounded-lg border p-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-transparent hover:border-border hover:bg-muted/60',
        isPending && 'pointer-events-none opacity-50',
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={asset.publicUrl}
          alt={asset.filename}
          className="h-full w-full object-cover"
        />
        {/* Remove button */}
        <button
          type="button"
          onClick={handleRemove}
          aria-label="Remove image"
          className={cn(
            'absolute end-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100',
            isSelected && 'opacity-100',
          )}
        >
          <X size={10} strokeWidth={3} />
        </button>
      </div>

      {/* Filename */}
      <p className="truncate px-0.5 text-[11px] leading-tight text-muted-foreground">
        {asset.filename}
      </p>
    </div>
  )
}

export function MediaGrid ({ assets, selectedUrl, onSelect, onRemove }: MediaGridProps) {
  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ImageIcon size={22} className="text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No images yet</p>
        <p className="text-xs text-muted-foreground">Upload an image to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {assets.map((asset) => (
        <MediaCard
          key={asset.id}
          asset={asset}
          isSelected={selectedUrl === asset.publicUrl}
          onSelect={() => onSelect(asset.publicUrl)}
          onRemove={() => onRemove(asset.id)}
        />
      ))}
    </div>
  )
}
