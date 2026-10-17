'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Home, Loader2, Pencil } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { cn } from '@/lib/utils'
import { useBuilderStore, type WebsitePageRow } from '@/lib/builder/store'
import { flushBuilderAutosave } from '@/components/website-builder/use-builder-autosave'
import { PageUiPreview } from '@/components/website-builder/section-ui-preview'
import { pagePreviewSections } from '@/lib/builder/page-preview-sections'

const PREVIEW_HEIGHT = 300

interface WebsiteOverviewProps {
  websiteId: string
  /** UI locale, for page names. */
  locale: string
  /** The site's default content locale, for rendering the previews. */
  defaultLocale: string
  onOpenPage: (pageId: string) => void
  /** Rendered above the page grid (e.g. the final QA report). */
  header?: ReactNode
}

/**
 * Every page of the site at a glance, each as a live scaled preview built from
 * the builder store (so unsaved AI edits show immediately). Clicking a preview
 * opens it in the AI view; the pen opens the existing visual editor.
 */
export function WebsiteOverview ({ websiteId, locale, defaultLocale, onOpenPage, header }: WebsiteOverviewProps) {
  const t = useTranslations('aiBuilder.overview')
  const pages = useBuilderStore((s) => s.pages)
  const ordered = [...pages].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <div className="h-full overflow-y-auto bg-muted/30">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle', { count: ordered.length })}</p>
        </div>

        {header}

        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {ordered.map((page) => (
            <li key={page.id}>
              <OverviewPageCard
                page={page}
                websiteId={websiteId}
                locale={locale}
                defaultLocale={defaultLocale}
                onOpen={() => onOpenPage(page.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function OverviewPageCard ({
  page,
  websiteId,
  locale,
  defaultLocale,
  onOpen,
}: {
  page: WebsitePageRow
  websiteId: string
  locale: string
  defaultLocale: string
  onOpen: () => void
}) {
  const t = useTranslations('aiBuilder.overview')
  const router = useRouter()
  const [navigating, setNavigating] = useState(false)

  const isActive = useBuilderStore((s) => s.activePageId === page.id)
  const activeSections = useBuilderStore((s) => (isActive ? s.sections : null))
  const activeStyles = useBuilderStore((s) => (isActive ? s.elementStyles : null))
  const activeAttributes = useBuilderStore((s) => (isActive ? s.elementAttributes : null))
  const sharedHeader = useBuilderStore((s) => s.sharedHeader)
  const sharedFooter = useBuilderStore((s) => s.sharedFooter)
  const designSystem = useBuilderStore((s) => s.designSystem)
  const projectName = useBuilderStore((s) => s.projectName)
  const projectLogoUrl = useBuilderStore((s) => s.projectLogoUrl)

  // The active page's live content lives at the top of the store; every other
  // page's content is its row's draft.
  const bodySections = activeSections ?? page.draftContent?.sections ?? []
  const elementStyles = activeStyles ?? page.draftContent?.elementStyles
  const elementAttributes = activeAttributes ?? page.draftContent?.elementAttributes
  const sections = pagePreviewSections({
    sections: bodySections,
    sharedHeader,
    sharedFooter,
    useSharedHeader: page.useSharedHeader,
    useSharedFooter: page.useSharedFooter,
  })
  const name = page.name?.[locale] ?? page.name?.en ?? Object.values(page.name ?? {})[0] ?? page.slug

  async function openEditor () {
    setNavigating(true)
    // Don't leave the AI view with unsaved AI edits on the table.
    await flushBuilderAutosave().catch(() => {})
    router.push(`/website-builder/edit/${websiteId}?page=${encodeURIComponent(page.slug)}`)
  }

  return (
    <article className="group overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={onOpen}
        aria-label={t('openPage', { name })}
        className="block w-full overflow-hidden text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <LazyMount height={PREVIEW_HEIGHT}>
          {bodySections.length ? (
            <PageUiPreview
              sections={sections}
              designSystem={designSystem}
              elementStyles={elementStyles}
              elementAttributes={elementAttributes}
              projectLogoUrl={projectLogoUrl}
              projectName={projectName}
              defaultLocale={defaultLocale}
              viewportHeight={PREVIEW_HEIGHT}
              scrollOnGroupHover
              fallbackLabel={name}
            />
          ) : (
            <div
              className="flex items-center justify-center bg-muted/40 text-sm text-muted-foreground"
              style={{ height: PREVIEW_HEIGHT }}
            >
              {t('emptyPage')}
            </div>
          )}
        </LazyMount>
      </button>

      <div className="flex items-center gap-2 border-t p-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
            {page.isHome ? <Home className="size-3.5 shrink-0 text-primary" aria-label={t('home')} /> : null}
            <span className="truncate">{name}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            <span dir="ltr">/{page.slug}</span> · {t('sections', { count: bodySections.length })}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="shrink-0 gap-1.5"
          onClick={() => void openEditor()}
          disabled={navigating}
          aria-label={t('editPage', { name })}
        >
          {navigating ? <Loader2 className="size-3.5 animate-spin" /> : <Pencil className="size-3.5" />}
          {t('edit')}
        </Button>
      </div>
    </article>
  )
}

/** Mount heavy previews only once they approach the viewport. */
function LazyMount ({ height, children }: { height: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible])

  return (
    <div ref={ref} style={{ height }} className={cn(!visible && 'animate-pulse bg-muted/60')}>
      {visible ? children : null}
    </div>
  )
}
