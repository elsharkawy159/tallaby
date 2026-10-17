'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { builderLivePreviewPath } from '@/lib/builder/preview-urls'
import { useBuilderStore } from '@/lib/builder/store'
import { cn } from '@workspace/ui/lib/utils'
import {
  PREVIEW_DEVICE_WIDTHS,
  SECTION_ACTIONS,
  usePreviewBridge,
  type PreviewDevice,
  type SectionAction,
} from './use-preview-bridge'

type Props = {
  websiteId: string
  pageSlug: string
  className?: string
  /** Enables the per-section hover toolbar inside the preview. */
  onSectionAction?: (action: SectionAction, instanceId: string) => void
  /** Localized toolbar labels (the iframe has no translations of its own). */
  sectionActionLabels?: Record<SectionAction, string>
}

/** Section AI statuses that mean "work in progress" (shimmer in the preview). */
const BUSY_AI_STATUSES = new Set(['preparing', 'writing', 'translating', 'images'])

/**
 * Live builder preview at `/website-builder/live-preview/...` (postMessage).
 * The iframe renders BuilderModeBridge; the parent pushes zustand state so
 * preview stays in sync without a separate DB round-trip.
 */
export function PreviewFrame ({
  websiteId,
  pageSlug,
  className,
  onSectionAction,
  sectionActionLabels,
}: Props) {
  const deviceMode = useBuilderStore((s) => s.deviceMode) as PreviewDevice
  const saveStatus = useBuilderStore((s) => s.saveStatus)
  const isDirty = useBuilderStore((s) => s.isDirty)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const postTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const onSectionActionRef = useRef(onSectionAction)
  const labelsRef = useRef(sectionActionLabels)

  useEffect(() => {
    onSectionActionRef.current = onSectionAction
    labelsRef.current = sectionActionLabels
  })

  // Toolbar clicks inside the iframe → the host (only from our own frame).
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'BUILDER_SECTION_ACTION') return
      if (e.source !== iframeRef.current?.contentWindow) return
      const action = e.data.action as SectionAction
      const instanceId = e.data.instanceId
      if (typeof instanceId !== 'string' || !SECTION_ACTIONS.includes(action)) return
      onSectionActionRef.current?.(action, instanceId)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const src = useMemo(
    () => `${builderLivePreviewPath(websiteId, pageSlug)}?embed=1`,
    [websiteId, pageSlug]
  )

  const getState = useCallback(() => {
    const state = useBuilderStore.getState()
    const content = state.getPageContent()
    const activePage = state.pages.find((p) => p.id === state.activePageId)
    return {
      sections: content.sections,
      designSystem: state.designSystem,
      elementStyles: content.elementStyles,
      elementAttributes: content.elementAttributes,
      injectedChildren: content.injectedChildren,
      sharedHeader: state.sharedHeader,
      sharedFooter: state.sharedFooter,
      useSharedHeader: activePage?.useSharedHeader ?? true,
      useSharedFooter: activePage?.useSharedFooter ?? true,
      projectLogoUrl: state.projectLogoUrl,
      projectName: state.projectName,
      interactive: Boolean(onSectionActionRef.current),
      sectionActionLabels: labelsRef.current,
      aiLoadingSectionIds: Object.entries(state.aiLoadingSections)
        .filter(([, status]) => status && BUSY_AI_STATUSES.has(status))
        .map(([id]) => id),
    }
  }, [])

  const { post, handleLoad } = usePreviewBridge(iframeRef, getState)

  const schedulePostBuilderState = useCallback(() => {
    if (postTimerRef.current) clearTimeout(postTimerRef.current)
    postTimerRef.current = setTimeout(() => {
      postTimerRef.current = undefined
      post()
    }, 50)
  }, [post])

  useEffect(() => {
    setIframeLoaded(false)
  }, [src])

  useEffect(() => {
    const unsub = useBuilderStore.subscribe(schedulePostBuilderState)
    return () => {
      unsub()
      if (postTimerRef.current) clearTimeout(postTimerRef.current)
    }
  }, [schedulePostBuilderState])

  const width = PREVIEW_DEVICE_WIDTHS[deviceMode]
  const showSavingOverlay = saveStatus === 'saving' || (isDirty && !iframeLoaded)

  return (
    <div
      className={cn(
        'flex h-full items-start justify-center overflow-auto bg-[#111] p-3',
        className
      )}
    >
      <div
        className="relative h-full overflow-hidden rounded-lg bg-white shadow-2xl transition-all duration-300"
        style={{ width, maxWidth: '100%', minHeight: '100%' }}
      >
        <iframe
          key={src}
          ref={iframeRef}
          src={src}
          className="h-full w-full border-0"
          title="Website preview"
          onLoad={() => {
            setIframeLoaded(true)
            handleLoad()
          }}
        />
        {showSavingOverlay ? (
          <div className="pointer-events-none absolute end-3 top-3 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium shadow-md backdrop-blur">
            <Loader2 className="size-3 animate-spin text-violet-500" />
            Syncing…
          </div>
        ) : null}
      </div>
    </div>
  )
}
