'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Image as ImageIcon, Loader2, Pencil, RefreshCw, Sparkles } from 'lucide-react'
import {
  SECTION_ACTIONS,
  type SectionAction,
} from '@/components/website-builder/preview/use-preview-bridge'
import { PublicSectionsRenderer } from '@/components/website-builder/public-sections-renderer'
import type { SectionInstance, ElementChromeAttributes } from '@/components/sections/registry.types'
import type { ComponentNode } from '@/lib/builder/component-node'
import type { BuilderDesignSystemState } from '@/lib/builder/design-system-map'
import { scrollToSectionInDocument } from '@/lib/builder/scroll-preview-to-section'
import { cn } from '@workspace/ui/lib/utils'

/** A section that is planned but not written yet (AI generation in progress). */
type PendingSection = { id: string; label: string }

type BuilderState = {
  /** Shimmer placeholders rendered after `sections` — already-localized labels. */
  pendingSections?: PendingSection[]
  /** Show the per-section AI toolbar on hover (AI builder only). */
  interactive?: boolean
  sectionActionLabels?: Partial<Record<SectionAction, string>>
  /** Sections the AI is currently rewriting — shimmer overlay. */
  aiLoadingSectionIds?: string[]
  sections: SectionInstance[]
  designSystem: BuilderDesignSystemState
  elementStyles: Record<string, CSSProperties>
  elementAttributes: Record<string, ElementChromeAttributes>
  injectedChildren: Record<string, ComponentNode[]>
  sharedHeader?: SectionInstance | null
  sharedFooter?: SectionInstance | null
  useSharedHeader?: boolean
  useSharedFooter?: boolean
  projectLogoUrl?: string | null
  projectName?: string | null
}

function postReady () {
  if (typeof window === 'undefined' || window.parent === window) return
  window.parent.postMessage({ type: 'BUILDER_READY' }, '*')
}

export function BuilderModeBridge ({
  websiteId,
  projectId,
  ownerPlan,
}: {
  websiteId: string
  projectId: string | null
  ownerPlan: string
}) {
  const [state, setState] = useState<BuilderState | null>(null)

  useEffect(() => {
    postReady()

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === 'BUILDER_HELLO') {
        postReady()
        return
      }
      if (e.data?.type === 'BUILDER_SCROLL_TO_SECTION') {
        const sectionId =
          typeof e.data.sectionId === 'string' ? e.data.sectionId : ''
        if (sectionId) scrollToSectionInDocument(sectionId)
        return
      }
      if (e.data?.type !== 'BUILDER_STATE') return
      setState({
        sections: e.data.sections ?? [],
        designSystem: e.data.designSystem ?? {},
        elementStyles: e.data.elementStyles ?? {},
        elementAttributes: e.data.elementAttributes ?? {},
        injectedChildren: e.data.injectedChildren ?? {},
        sharedHeader: e.data.sharedHeader ?? null,
        sharedFooter: e.data.sharedFooter ?? null,
        useSharedHeader: e.data.useSharedHeader ?? true,
        useSharedFooter: e.data.useSharedFooter ?? true,
        projectLogoUrl: e.data.projectLogoUrl ?? null,
        projectName: e.data.projectName ?? null,
        pendingSections: Array.isArray(e.data.pendingSections)
          ? (e.data.pendingSections as unknown[]).filter(
              (p): p is PendingSection =>
                !!p &&
                typeof (p as PendingSection).id === 'string' &&
                typeof (p as PendingSection).label === 'string'
            )
          : [],
        interactive: e.data.interactive === true,
        sectionActionLabels:
          e.data.sectionActionLabels && typeof e.data.sectionActionLabels === 'object'
            ? e.data.sectionActionLabels
            : undefined,
        aiLoadingSectionIds: Array.isArray(e.data.aiLoadingSectionIds)
          ? (e.data.aiLoadingSectionIds as unknown[]).filter((id): id is string => typeof id === 'string')
          : [],
      })
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const renderSections = useMemo(() => {
    if (!state) return []
    const showHeader =
      state.sharedHeader != null && (state.useSharedHeader ?? true)
    const showFooter =
      state.sharedFooter != null && (state.useSharedFooter ?? true)
    return [
      ...(showHeader ? [state.sharedHeader!] : []),
      ...state.sections,
      ...(showFooter ? [state.sharedFooter!] : []),
    ]
  }, [state])

  if (!state) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const pending = state.pendingSections ?? []

  if (!renderSections.length && !pending.length) {
    return <BuilderEmptyState />
  }

  const overlay = state.interactive ? (
    <SectionActionOverlay
      labels={state.sectionActionLabels ?? {}}
      loadingIds={state.aiLoadingSectionIds ?? []}
    />
  ) : null

  try {
    return (
      <>
        {renderSections.length ? (
          <PublicSectionsRenderer
            sections={renderSections}
            designSystem={state.designSystem}
            elementStyles={state.elementStyles}
            elementAttributes={state.elementAttributes}
            injectedChildren={state.injectedChildren}
            projectLogoUrl={state.projectLogoUrl ?? null}
            projectName={state.projectName ?? null}
            websiteId={null}
            madeInValorcyBadge={
              projectId && !pending.length
                ? {
                    websiteId,
                    projectId,
                    plan: ownerPlan,
                    context: 'preview',
                  }
                : null
            }
          />
        ) : null}
        {pending.length ? <PendingSections items={pending} /> : null}
        {overlay}
      </>
    )
  } catch (err) {
    console.error('[BuilderModeBridge] render failure', err)
    return <BuilderEmptyState error />
  }
}

type Box = { id: string; top: number; left: number; width: number; height: number }

function boxOf (el: Element, id: string): Box {
  const rect = el.getBoundingClientRect()
  return {
    id,
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
  }
}

const ACTION_ICONS: Record<SectionAction, typeof Sparkles> = {
  ask: Sparkles,
  regenerate: RefreshCw,
  images: ImageIcon,
  edit: Pencil,
}

/**
 * Hover outline + quick AI actions for each rendered section, and a shimmer
 * over sections the AI is working on. Clicks are posted to the host builder,
 * which owns the actual work (credits, store, navigation).
 */
function SectionActionOverlay ({
  labels,
  loadingIds,
}: {
  labels: Partial<Record<SectionAction, string>>
  loadingIds: string[]
}) {
  const [hover, setHover] = useState<Box | null>(null)
  const [loadingBoxes, setLoadingBoxes] = useState<Box[]>([])
  const loadingKey = loadingIds.join('|')

  useEffect(() => {
    const onOver = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null
      // Moving onto the toolbar itself keeps the current section.
      if (!target || target.closest('[data-section-toolbar]')) return
      const el = target.closest('[data-section-instance-id]')
      const id = el?.getAttribute('data-section-instance-id')
      if (el && id) setHover(boxOf(el, id))
    }
    const onLeave = () => setHover(null)
    document.addEventListener('mouseover', onOver)
    document.documentElement.addEventListener('mouseleave', onLeave)
    return () => {
      document.removeEventListener('mouseover', onOver)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  useEffect(() => {
    const ids = loadingKey ? loadingKey.split('|') : []
    if (!ids.length) return
    const measure = () =>
      setLoadingBoxes(
        ids.flatMap((id) => {
          const el = document.querySelector(`[data-section-instance-id="${CSS.escape(id)}"]`)
          return el ? [boxOf(el, id)] : []
        })
      )
    measure()
    const timer = window.setInterval(measure, 800)
    return () => window.clearInterval(timer)
  }, [loadingKey])

  const post = (action: SectionAction, instanceId: string) => {
    window.parent?.postMessage({ type: 'BUILDER_SECTION_ACTION', action, instanceId }, '*')
  }

  if (typeof document === 'undefined') return null

  // Boxes measured for a previous loading set are stale once nothing is loading.
  const visibleLoadingBoxes = loadingKey ? loadingBoxes : []

  return createPortal(
    <>
      {visibleLoadingBoxes.map((box) => (
        <div
          key={`loading-${box.id}`}
          aria-hidden
          className="pointer-events-none absolute z-[9997] flex items-center justify-center rounded-md bg-primary/10 ring-2 ring-primary/40"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
        >
          <div className="absolute inset-0 animate-pulse rounded-md bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
          <Loader2 className="relative size-6 animate-spin text-primary" />
        </div>
      ))}
      {hover && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute z-[9998] rounded-md ring-2 ring-primary/60"
            style={{ top: hover.top, left: hover.left, width: hover.width, height: hover.height }}
          />
          <div
            data-section-toolbar
            className="absolute z-[9999] flex items-center gap-0.5 rounded-full border bg-background/95 p-1 text-foreground shadow-lg backdrop-blur"
            style={{
              top: hover.top + 12,
              left: hover.left + hover.width - 12,
              transform: 'translateX(-100%)',
            }}
          >
            {SECTION_ACTIONS.map((action) => {
              const Icon = ACTION_ICONS[action]
              const label = labels[action] ?? action
              return (
                <button
                  key={action}
                  type="button"
                  title={label}
                  aria-label={label}
                  onClick={() => post(action, hover.id)}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </>,
    document.body
  )
}

/** Placeholders for planned sections the AI is still writing. */
function PendingSections ({ items }: { items: PendingSection[] }) {
  return (
    <div className="space-y-4 bg-background px-4 py-6 sm:px-8" data-no-instrument aria-busy="true">
      {items.map((item, i) => (
        <div
          key={item.id}
          className={cn(
            'relative flex h-56 items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted/40',
            i === 0 && 'border-primary/40 bg-primary/5'
          )}
        >
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
          <span className="relative inline-flex items-center gap-2 text-sm text-muted-foreground">
            {i === 0 ? <span className="size-2 animate-ping rounded-full bg-primary" /> : null}
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function BuilderEmptyState ({ error }: { error?: boolean }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-background via-background to-violet-500/5 p-8">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-500">
          <Sparkles className="size-6" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          {error ? 'Preview unavailable' : 'This page is empty'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {error
            ? 'A section failed to render. Try undoing the last AI change.'
            : 'Send a prompt in the chat to generate your first sections, or pick a starter template.'}
        </p>
      </div>
    </div>
  )
}
