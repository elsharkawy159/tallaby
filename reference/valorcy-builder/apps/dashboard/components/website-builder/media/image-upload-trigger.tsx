'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import { MediaLibraryDialog } from './media-library-dialog'

export interface ImageUploadTriggerProps {
  /** The section instance ID — passed to MediaLibraryDialog for context */
  sectionId: string
  /** The Framely project ID — used for getProjectMediaAssets query and upload */
  projectId: string
  /** The current image URL — used as previousUrl so the dialog can revert on upload failure */
  currentUrl?: string
  /** Called with the new URL when the user picks or uploads an image (called up to three times
   *  per upload: blob URL immediately, CDN URL on success, or previousUrl on failure) */
  onCommit: (url: string) => void
  /** When true, the hover overlay is hidden (canvas preview mode) */
  isPreview?: boolean
  /** The image content to wrap */
  children: React.ReactNode
  className?: string
}

export function ImageUploadTrigger ({
  sectionId,
  projectId,
  currentUrl,
  onCommit,
  isPreview,
  children,
  className,
}: ImageUploadTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className={cn('group relative', className)}
        data-image-prop="true"
      >
        {children}
        <div
          className={cn(
            'absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity duration-150 group-hover:opacity-100',
            isPreview && 'hidden',
          )}
          onClick={() => setOpen(true)}
          role="button"
          aria-label="Change image"
        >
          <Camera size={20} className="text-white" />
        </div>
      </div>

      <MediaLibraryDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        previousUrl={currentUrl ?? ''}
        onCommit={onCommit}
      />
    </>
  )
}
