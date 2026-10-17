'use client'

import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { updateWebsitePageDraft } from '@/actions/website-page-actions'
import { updateDesignSystem } from '@/actions/design-system-actions'
import { updateWebsiteSharedSlots } from '@/actions/website-actions'
import { useBuilderStore } from '@/lib/builder/store'

// Auto-save fires this long after the last edit. Kept high enough that bursts of
// edits (typing, dragging) collapse into a single DB write instead of one per pause.
const DEBOUNCE_MS = 1500

let globalFlushAutosave: (() => Promise<boolean>) | null = null
let globalRetryAutosave: (() => Promise<boolean>) | null = null

/** Await pending draft + design-system saves (used before preview / page switch). */
export async function flushBuilderAutosave (): Promise<boolean> {
  if (!globalFlushAutosave) return true
  return globalFlushAutosave()
}

export async function retryBuilderAutosave (): Promise<boolean> {
  if (!globalRetryAutosave) return true
  return globalRetryAutosave()
}

export function useBuilderAutosave ({
  projectId,
  websiteId,
  enabled = true
}: {
  projectId: string
  websiteId: string
  enabled?: boolean
}) {
  const projectIdRef = useRef(projectId)
  const websiteIdRef = useRef(websiteId)
  projectIdRef.current = projectId
  websiteIdRef.current = websiteId
  const savingRef = useRef(false)
  const dsSavingRef = useRef(false)

  const persistDraft = useCallback(async (): Promise<boolean> => {
    const state = useBuilderStore.getState()
    if (!state.isDirty || !state.pageId) return true
    if (savingRef.current) return false
    savingRef.current = true
    state.setSaveStatus('saving')
    try {
      const content = state.getPageContent()
      const res = await updateWebsitePageDraft(
        projectIdRef.current,
        state.pageId,
        websiteIdRef.current,
        {
          ...content,
          clientVersion: state.pageVersion
        }
      )
      if (!res.ok) {
        toast.error('This page was changed elsewhere', {
          description:
            'Your local edits stayed; click retry to overwrite, or reload to take the server version.',
          action: {
            label: 'Reload',
            onClick: () => window.location.reload(),
          },
        })
        useBuilderStore.getState().setPageVersion(res.serverVersion)
        useBuilderStore.getState().setSaveStatus('error')
        return false
      }
      if (res.page?.version === undefined || !state.pageId) {
        useBuilderStore.getState().setSaveStatus('error')
        return false
      }
      useBuilderStore
        .getState()
        .finalizeDraftPersist(state.pageId, res.page.version)
      return true
    } catch (e) {
      console.error(e)
      useBuilderStore.getState().setSaveStatus('error')
      return false
    } finally {
      savingRef.current = false
    }
  }, [])

  const persistDesignSystem = useCallback(async () => {
    const state = useBuilderStore.getState()
    if (!state.projectId || dsSavingRef.current) return
    dsSavingRef.current = true
    try {
      const res = await updateDesignSystem(state.projectId, {
        colors: state.designSystem.colors,
        typography: state.designSystem.typography,
        spacing: state.designSystem.spacing,
        customCss: state.designSystem.customCss ?? null
      })
      if (res?.version !== undefined) {
        useBuilderStore.getState().setDsVersion(res.version)
      }
    } catch (e) {
      console.error(e)
    } finally {
      dsSavingRef.current = false
    }
  }, [])

  const flush = useCallback(async (): Promise<boolean> => {
    const draftOk = await persistDraft()
    await persistDesignSystem()
    return draftOk
  }, [persistDraft, persistDesignSystem])

  useEffect(() => {
    if (!enabled) {
      globalFlushAutosave = null
      globalRetryAutosave = null
      return () => {
        globalFlushAutosave = null
        globalRetryAutosave = null
      }
    }

    globalFlushAutosave = flush
    globalRetryAutosave = flush

    let timer: ReturnType<typeof setTimeout> | undefined
    let lastSections = useBuilderStore.getState().sections
    let lastElementStyles = useBuilderStore.getState().elementStyles
    let lastElementAttributes = useBuilderStore.getState().elementAttributes
    let lastInjectedChildren = useBuilderStore.getState().injectedChildren
    let lastDesignSystem = useBuilderStore.getState().designSystem
    let lastSharedHeader = useBuilderStore.getState().sharedHeader
    let lastSharedFooter = useBuilderStore.getState().sharedFooter

    const unsub = useBuilderStore.subscribe(() => {
      const s = useBuilderStore.getState()

      if (!s.isDirty || !s.pageId) {
        if (timer) {
          clearTimeout(timer)
          timer = undefined
        }
        lastSections = s.sections
        lastElementStyles = s.elementStyles
        lastElementAttributes = s.elementAttributes
        lastInjectedChildren = s.injectedChildren
        lastDesignSystem = s.designSystem
        lastSharedHeader = s.sharedHeader
        lastSharedFooter = s.sharedFooter
        return
      }

      const sharedSlotsChanged =
        s.sharedHeader !== lastSharedHeader ||
        s.sharedFooter !== lastSharedFooter

      const changed =
        s.sections !== lastSections ||
        s.elementStyles !== lastElementStyles ||
        s.elementAttributes !== lastElementAttributes ||
        s.injectedChildren !== lastInjectedChildren ||
        s.designSystem !== lastDesignSystem ||
        sharedSlotsChanged

      if (!changed) return

      lastSections = s.sections
      lastElementStyles = s.elementStyles
      lastElementAttributes = s.elementAttributes
      lastInjectedChildren = s.injectedChildren
      const designChanged = s.designSystem !== lastDesignSystem
      lastDesignSystem = s.designSystem
      lastSharedHeader = s.sharedHeader
      lastSharedFooter = s.sharedFooter

      if (timer) {
        clearTimeout(timer)
        timer = undefined
      }

      timer = setTimeout(() => {
        timer = undefined
        void persistDraft()
        if (designChanged) {
          void persistDesignSystem()
        }
        if (sharedSlotsChanged && s.websiteId) {
          void updateWebsiteSharedSlots(s.websiteId, s.sharedHeader, s.sharedFooter)
        }
      }, DEBOUNCE_MS)
    })

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void flush()
      }
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const s = useBuilderStore.getState()
      if (!s.isDirty) return
      // Best-effort sync flush; browsers may not wait, but warn user too.
      void flush()
      e.preventDefault()
      e.returnValue = ''
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      unsub()
      if (timer) clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('beforeunload', onBeforeUnload)
      globalFlushAutosave = null
      globalRetryAutosave = null
    }
  }, [enabled, flush, persistDraft, persistDesignSystem])

  return { flush, retry: flush }
}
