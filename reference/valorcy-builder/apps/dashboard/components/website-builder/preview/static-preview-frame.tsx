'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { builderLivePreviewPath } from '@/lib/builder/preview-urls'
import { cn } from '@workspace/ui/lib/utils'
import { PREVIEW_DEVICE_WIDTHS, usePreviewBridge, type PreviewDevice } from './use-preview-bridge'

export type { PreviewDevice } from './use-preview-bridge'

interface StaticPreviewFrameProps {
  websiteId: string
  /** Only addresses the iframe route; the rendered content comes from `state`. */
  pageSlug: string
  /** BUILDER_STATE payload (sections, designSystem, shared chrome, …). */
  state: Record<string, unknown>
  device?: PreviewDevice
  title: string
  className?: string
}

/**
 * Live preview driven by props instead of the builder store — for surfaces
 * that render content the builder hasn't loaded (e.g. an in-flight generation).
 */
export function StaticPreviewFrame ({
  websiteId,
  pageSlug,
  state,
  device = 'desktop',
  title,
  className,
}: StaticPreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const stateRef = useRef(state)
  const src = useMemo(() => `${builderLivePreviewPath(websiteId, pageSlug)}?embed=1`, [websiteId, pageSlug])
  const getState = useCallback(() => stateRef.current, [])
  const { post, handleLoad } = usePreviewBridge(iframeRef, getState)

  useEffect(() => {
    stateRef.current = state
    post()
  }, [state, post])

  return (
    <div className={cn('flex h-full items-start justify-center overflow-auto bg-muted p-3', className)}>
      <div
        className="relative h-full overflow-hidden rounded-lg bg-background shadow-2xl transition-all duration-300"
        style={{ width: PREVIEW_DEVICE_WIDTHS[device], maxWidth: '100%', minHeight: '100%' }}
      >
        <iframe
          ref={iframeRef}
          src={src}
          title={title}
          className="h-full w-full border-0"
          onLoad={handleLoad}
        />
      </div>
    </div>
  )
}
