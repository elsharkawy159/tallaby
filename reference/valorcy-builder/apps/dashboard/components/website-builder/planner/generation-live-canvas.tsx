'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AlertCircle, Monitor, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SectionInstance } from '@/components/sections/registry.types'
import type { BuilderDesignSystemState } from '@/lib/builder/design-system-map'
import type { PageProgress } from '@/lib/ai/generation-phases'
import type { WebsitePlan } from '@/lib/ai/site-plan-schema'
import type { GenerationTaskPage } from '@/components/website-builder/generation-progress/status-mapping'
import {
  StaticPreviewFrame,
  type PreviewDevice,
} from '@/components/website-builder/preview/static-preview-frame'
import { BuildStatusIcon } from './build-tree'
import { isChromePlanSection, planSectionLabel } from './plan-canvas/plan-labels'

/** Server-loaded site context the preview needs before anything is persisted. */
export interface LivePreviewContext {
  designSystem: BuilderDesignSystemState
  sharedHeader: unknown
  sharedFooter: unknown
  projectName: string | null
  projectLogoUrl: string | null
}

type Chrome = { header: SectionInstance | null; footer: SectionInstance | null }
type PreviewPayload = { slug: string; sections: SectionInstance[]; chrome: Chrome | null }

function asInstance (value: unknown): SectionInstance | null {
  return !!value &&
    typeof value === 'object' &&
    typeof (value as { sectionId?: unknown }).sectionId === 'string'
    ? (value as SectionInstance)
    : null
}

/**
 * The iframe route only needs *a* slug — the content arrives over postMessage —
 * so one stable URL means switching tabs never reloads the frame.
 */
const PREVIEW_ROUTE_SLUG = 'home'

interface GenerationLiveCanvasProps {
  websiteId: string
  generationId: string | null
  plan: WebsitePlan | null
  buildPages: PageProgress[]
  taskPages: GenerationTaskPage[]
  /** True once the shared navbar/footer have been generated (SEO phase done). */
  chromeReady: boolean
  context: LivePreviewContext
}

/**
 * Right-hand canvas while a site is generated: the page being written renders
 * section by section from the run's staged content, with shimmer placeholders
 * for sections still to come. Follows the active page until the user picks one.
 */
export function GenerationLiveCanvas ({
  websiteId,
  generationId,
  plan,
  buildPages,
  taskPages,
  chromeReady,
  context,
}: GenerationLiveCanvasProps) {
  const t = useTranslations('aiCreate.live')
  const tc = useTranslations('aiCreate.categories')
  const [pinnedSlug, setPinnedSlug] = useState<string | null>(null)
  const [device, setDevice] = useState<PreviewDevice>('desktop')
  const [preview, setPreview] = useState<PreviewPayload | null>(null)

  // Before the run seeds its build tree, show the approved plan as pending.
  const pages: PageProgress[] = useMemo(() => {
    if (buildPages.length) return buildPages
    return (plan?.pages ?? []).map((pg) => ({
      slug: pg.slug,
      name: pg.name,
      status: 'pending' as const,
      sections: pg.sections
        .filter((s) => !isChromePlanSection(s))
        .map((s) => ({
          key: s.id,
          label: planSectionLabel(s, (c) => (tc.has(c) ? tc(c) : c)),
          status: 'pending' as const,
        })),
    }))
  }, [buildPages, plan, tc])

  const autoSlug =
    pages.find((p) => p.status === 'running')?.slug ??
    [...pages].reverse().find((p) => p.status === 'done')?.slug ??
    pages[0]?.slug ??
    null
  const slug = pinnedSlug && pages.some((p) => p.slug === pinnedSlug) ? pinnedSlug : autoSlug
  const version = taskPages.find((p) => p.slug === slug)?.updatedAt ?? ''

  useEffect(() => {
    if (!generationId || !slug) return
    let cancelled = false
    fetch(`/api/ai/generate-site/preview/${generationId}?slug=${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { sections?: unknown; chrome?: { header?: unknown; footer?: unknown } | null } | null) => {
        if (cancelled || !data) return
        setPreview({
          slug,
          sections: Array.isArray(data.sections) ? (data.sections as SectionInstance[]) : [],
          chrome: data.chrome
            ? { header: asInstance(data.chrome.header), footer: asInstance(data.chrome.footer) }
            : null,
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // `version` and `chromeReady` are refetch triggers: new staged sections, or
    // the navbar/footer becoming available.
  }, [generationId, slug, version, chromeReady])

  const page = pages.find((p) => p.slug === slug)
  const sections = useMemo(
    () => (preview && preview.slug === slug ? preview.sections : []),
    [preview, slug]
  )

  const pending = useMemo(() => {
    if (!page || page.status === 'failed') return []
    return page.sections.slice(sections.length).map((s, i) => ({
      id: s.key,
      label: i === 0 && page.status === 'running' ? t('writing', { name: s.label }) : s.label,
    }))
  }, [page, sections.length, t])

  // The site's existing navbar/footer win (the run keeps them), else the
  // freshly generated pair once it exists. The footer waits for the page body.
  const header = asInstance(context.sharedHeader) ?? preview?.chrome?.header ?? null
  const footer = asInstance(context.sharedFooter) ?? preview?.chrome?.footer ?? null

  const state = useMemo(
    () => ({
      sections,
      designSystem: context.designSystem,
      elementStyles: {},
      elementAttributes: {},
      injectedChildren: {},
      sharedHeader: header,
      sharedFooter: pending.length ? null : footer,
      useSharedHeader: true,
      useSharedFooter: true,
      projectLogoUrl: context.projectLogoUrl,
      projectName: context.projectName,
      pendingSections: pending,
    }),
    [sections, context.designSystem, context.projectLogoUrl, context.projectName, header, footer, pending]
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b bg-background px-3 py-2">
        <div
          className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto"
          role="tablist"
          aria-label={t('pages')}
        >
          {pages.map((p) => (
            <button
              key={p.slug}
              type="button"
              role="tab"
              aria-selected={p.slug === slug}
              onClick={() => setPinnedSlug(p.slug)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                p.slug === slug
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <BuildStatusIcon status={p.status} className="size-3.5" />
              {p.name}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center rounded-lg border p-0.5">
          {(['desktop', 'mobile'] as const).map((d) => {
            const Icon = d === 'desktop' ? Monitor : Smartphone
            return (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                aria-label={t(d)}
                title={t(d)}
                onClick={() => setDevice(d)}
                className={cn(
                  'rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  device === d ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon className="size-3.5" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <StaticPreviewFrame
          websiteId={websiteId}
          pageSlug={PREVIEW_ROUTE_SLUG}
          state={state}
          device={device}
          title={t('title')}
        />
        {page?.status === 'failed' && (
          <div className="absolute inset-x-0 top-5 mx-auto flex w-fit max-w-[90%] items-center gap-2 rounded-full border border-destructive/30 bg-background px-3 py-1.5 text-xs text-destructive shadow">
            <AlertCircle className="size-3.5 shrink-0" />
            {t('pageFailed')}
          </div>
        )}
      </div>
    </div>
  )
}
