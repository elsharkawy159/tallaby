'use client'

import { useCallback, useEffect, type RefObject } from 'react'

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'

/** Quick AI actions offered on a hovered section inside an interactive preview. */
export const SECTION_ACTIONS = ['ask', 'regenerate', 'images', 'edit'] as const
export type SectionAction = (typeof SECTION_ACTIONS)[number]

export const PREVIEW_DEVICE_WIDTHS: Record<PreviewDevice, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
}

/**
 * Parent side of the live-preview postMessage protocol (see
 * `builder-mode-bridge.tsx`): answer the iframe's BUILDER_READY with the
 * current state, and say hello on load so a reloaded frame asks again.
 *
 * `getState` should be stable; it's read at post time.
 */
export function usePreviewBridge (
  iframeRef: RefObject<HTMLIFrameElement | null>,
  getState: () => Record<string, unknown>
) {
  const post = useCallback(() => {
    const target = iframeRef.current?.contentWindow
    if (!target) return
    target.postMessage({ ...getState(), type: 'BUILDER_STATE' }, '*')
  }, [iframeRef, getState])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== 'BUILDER_READY') return
      // Several previews can live on one page — only answer our own frame.
      if (e.source && e.source !== iframeRef.current?.contentWindow) return
      post()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [iframeRef, post])

  const handleLoad = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'BUILDER_HELLO' }, '*')
    post()
  }, [iframeRef, post])

  return { post, handleLoad }
}
