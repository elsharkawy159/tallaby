'use client'

import { useCallback, useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { FileText, GripVertical, Home, Loader2, PanelTop, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Switch } from '@workspace/ui/components/switch'
import { cn } from '@/lib/utils'
import { SortableListProvider, useSortableListItem } from '@/components/dnd/sortable-list'
import { useSitePlanStore, useSitePlanStoreApi } from '@/lib/ai/use-site-plan-store'
import { planPartKey, type PlanPartTarget } from '@/lib/ai/plan-ops'
import { planId } from '@/lib/ai/plan-cms'
import { PLAN_LIMITS, type PlanPage, type WebsitePlan } from '@/lib/ai/site-plan-schema'
import type { PlanIssue, PlanValidation } from '@/lib/ai/plan-validation'
import { SectionLibraryDialog } from '../section-library-dialog'
import { DraftField, InlineEdit } from './inline-edit'
import { FieldLabel } from './plan-overview'
import { IssueIcon } from './plan-issues'
import { PlanSectionCard, pageIdFromSectionsGroup } from './plan-section-card'
import { isChromePlanSection } from './plan-labels'

const PAGES_GROUP = 'plan-pages'
const SEO_TITLE_SOFT_MAX = 60
const SEO_DESCRIPTION_SOFT_MAX = 160

interface PlanPagesProps {
  plan: WebsitePlan
  validation: PlanValidation
  selectedPageId: string | null
  onSelectPage: (pageId: string) => void
  focusSectionId?: string | null
  onRegenerate: (target: PlanPartTarget) => void
  onOpenCollection: (collectionId: string) => void
}

export function PlanPages ({
  plan,
  validation,
  selectedPageId,
  onSelectPage,
  focusSectionId,
  onRegenerate,
  onOpenCollection,
}: PlanPagesProps) {
  const planStore = useSitePlanStoreApi()
  const apply = useSitePlanStore((s) => s.apply)
  const page = plan.pages.find((p) => p.id === selectedPageId) ?? plan.pages[0]!

  const handleReorder = useCallback(
    (from: number, to: number, group: string) => {
      const current = planStore.getState().plan
      if (!current) return
      if (group === PAGES_GROUP) {
        const moved = current.pages[from]
        if (moved) apply({ op: 'page.move', pageId: moved.id, index: to })
        return
      }
      const pageId = pageIdFromSectionsGroup(group)
      const target = current.pages.find((p) => p.id === pageId)
      if (!target) return
      // The list hides navbar/footer, so its indices are into the visible
      // sections — map them back onto the page's real section array.
      const visible = target.sections
        .map((section, i) => ({ section, i }))
        .filter(({ section }) => !isChromePlanSection(section))
      const moved = visible[from]
      const destination = visible[to]
      if (moved && destination) {
        apply({ op: 'section.move', pageId: target.id, sectionId: moved.section.id, index: destination.i })
      }
    },
    [apply, planStore]
  )

  return (
    <SortableListProvider onReorder={handleReorder}>
      <div className="flex min-h-full flex-col lg:flex-row">
        <PageRail plan={plan} validation={validation} selectedPageId={page.id} onSelectPage={onSelectPage} />
        <div className="min-w-0 flex-1">
          <PageEditor
            key={page.id}
            page={page}
            isHome={plan.pages[0]?.id === page.id}
            canRemove={plan.pages.length > 1}
            plan={plan}
            issues={validation.issues.filter((i) => i.pageId === page.id)}
            focusSectionId={focusSectionId}
            onRegenerate={onRegenerate}
            onOpenCollection={onOpenCollection}
          />
        </div>
      </div>
    </SortableListProvider>
  )
}

function PageRail ({
  plan,
  validation,
  selectedPageId,
  onSelectPage,
}: {
  plan: WebsitePlan
  validation: PlanValidation
  selectedPageId: string
  onSelectPage: (pageId: string) => void
}) {
  const t = useTranslations('aiCreate.plan.pages')
  const apply = useSitePlanStore((s) => s.apply)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  function addPage (e?: FormEvent) {
    e?.preventDefault()
    const trimmed = name.trim()
    setName('')
    setAdding(false)
    if (!trimmed) return
    const page: PlanPage = { id: planId(), name: trimmed.slice(0, 60), slug: trimmed, showInNav: true, sections: [] }
    const result = apply({ op: 'page.add', page })
    if (result?.applied.length) onSelectPage(page.id)
  }

  return (
    <aside className="border-b bg-background/60 lg:w-64 lg:shrink-0 lg:border-e lg:border-b-0">
      <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('title')}</h3>
        <span className="text-xs tabular-nums text-muted-foreground">
          {plan.pages.length}/{PLAN_LIMITS.pages}
        </span>
      </div>
      <ol className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-visible">
        {plan.pages.map((page, index) => (
          <PageRailItem
            key={page.id}
            page={page}
            index={index}
            selected={page.id === selectedPageId}
            issues={validation.issues.filter((i) => i.pageId === page.id)}
            onSelect={() => onSelectPage(page.id)}
          />
        ))}
      </ol>
      <div className="px-2 pb-3">
        {adding ? (
          <form onSubmit={addPage}>
            <Input
              autoFocus
              value={name}
              maxLength={60}
              dir="auto"
              placeholder={t('newPageName')}
              aria-label={t('newPageName')}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => addPage()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setName('')
                  setAdding(false)
                }
              }}
              className="h-8"
            />
          </form>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-1.5 text-muted-foreground"
            onClick={() => setAdding(true)}
            disabled={plan.pages.length >= PLAN_LIMITS.pages}
          >
            <Plus className="size-3.5" />
            {t('addPage')}
          </Button>
        )}
      </div>
    </aside>
  )
}

function PageRailItem ({
  page,
  index,
  selected,
  issues,
  onSelect,
}: {
  page: PlanPage
  index: number
  selected: boolean
  issues: PlanIssue[]
  onSelect: () => void
}) {
  const t = useTranslations('aiCreate.plan.pages')
  const regenerating = useSitePlanStore((s) => s.busy.includes(planPartKey({ kind: 'page', pageId: page.id })))
  const { ref, handleRef, isDragging } = useSortableListItem({ id: page.id, index, group: PAGES_GROUP })
  const count = page.sections.filter((s) => !isChromePlanSection(s)).length
  const worst = issues.some((i) => i.severity === 'error') ? 'error' : null
  const Icon = index === 0 ? Home : FileText

  return (
    <li
      ref={ref}
      className={cn(
        'group flex min-w-44 items-center gap-1 rounded-lg transition-colors lg:min-w-0',
        selected ? 'bg-muted' : 'hover:bg-muted/60',
        isDragging && 'opacity-60 shadow-lg'
      )}
    >
      <button
        type="button"
        ref={handleRef}
        aria-label={t('drag', { name: page.name })}
        className="ms-1 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <GripVertical className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'page' : undefined}
        className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1.5 pe-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {regenerating ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
        ) : (
          <Icon className={cn('size-3.5 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
        )}
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate text-sm', selected && 'font-medium')} dir="auto">
            {page.name}
          </span>
          <span className="block truncate text-[11px] text-muted-foreground" dir="ltr">
            /{page.slug}
          </span>
        </span>
        {worst ? (
          <IssueIcon severity="error" />
        ) : (
          <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{count}</span>
        )}
      </button>
    </li>
  )
}

function PageEditor ({
  page,
  isHome,
  canRemove,
  plan,
  issues,
  focusSectionId,
  onRegenerate,
  onOpenCollection,
}: {
  page: PlanPage
  isHome: boolean
  canRemove: boolean
  plan: WebsitePlan
  issues: PlanIssue[]
  focusSectionId?: string | null
  onRegenerate: (target: PlanPartTarget) => void
  onOpenCollection: (collectionId: string) => void
}) {
  const t = useTranslations('aiCreate.plan.pages')
  const apply = useSitePlanStore((s) => s.apply)
  const target: PlanPartTarget = { kind: 'page', pageId: page.id }
  const regenerating = useSitePlanStore((s) => s.busy.includes(planPartKey(target)))
  const [libraryOpen, setLibraryOpen] = useState(false)

  const body = page.sections.filter((s) => !isChromePlanSection(s))
  const hasChrome = body.length !== page.sections.length
  const pageIssues = issues.filter((i) => !i.sectionId)
  const updatePage = (patch: Extract<Parameters<typeof apply>[0], { op: 'page.update' }>['patch']) =>
    apply({ op: 'page.update', pageId: page.id, patch })

  return (
    <div className={cn('mx-auto max-w-7xl space-y-5 p-4 sm:p-6', regenerating && 'pointer-events-none opacity-70')}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {isHome ? <Home className="size-5" /> : <FileText className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={page.name}
            onCommit={(name) => updatePage({ name })}
            ariaLabel={t('rename', { name: page.name })}
            className="text-lg font-semibold tracking-tight"
          />
          <div className="mt-1 flex max-w-sm items-center gap-1 px-1.5" dir="ltr">
            <span className="text-sm text-muted-foreground">/</span>
            <DraftField
              value={page.slug}
              maxLength={80}
              aria-label={t('slug')}
              onCommit={(slug) => updatePage({ slug })}
              className="h-7 border-transparent bg-transparent px-1 font-mono text-xs shadow-none hover:border-input"
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="me-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Switch
              checked={page.showInNav !== false}
              onCheckedChange={(showInNav) => updatePage({ showInNav })}
              aria-label={t('inNav')}
            />
            <span className="hidden sm:inline">{t('inNav')}</span>
          </label>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onRegenerate(target)} disabled={regenerating}>
            {regenerating ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            {regenerating ? t('regenerating') : t('regenerate')}
          </Button>
          {canRemove && !isHome && (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-destructive"
              onClick={() => apply({ op: 'page.remove', pageId: page.id })}
              aria-label={t('remove', { name: page.name })}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {pageIssues.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-dashed px-3 py-2">
          {pageIssues.map((issue) => (
            <li key={issue.code} className="flex items-center gap-2 text-xs">
              <IssueIcon severity={issue.severity} />
              <IssueText issue={issue} />
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <FieldLabel htmlFor={`page-${page.id}-purpose`}>{t('purpose')}</FieldLabel>
          <DraftField
            id={`page-${page.id}-purpose`}
            value={page.purpose ?? ''}
            maxLength={240}
            placeholder={t('purposePlaceholder')}
            onCommit={(purpose) => updatePage({ purpose })}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`page-${page.id}-seo-title`}>{t('seoTitle')}</FieldLabel>
          <DraftField
            id={`page-${page.id}-seo-title`}
            value={page.seoTitle ?? ''}
            maxLength={90}
            softMax={SEO_TITLE_SOFT_MAX}
            showCount
            placeholder={t('seoTitlePlaceholder')}
            onCommit={(seoTitle) => updatePage({ seoTitle })}
          />
        </div>
        <div>
          <FieldLabel htmlFor={`page-${page.id}-seo-description`}>{t('seoDescription')}</FieldLabel>
          <DraftField
            id={`page-${page.id}-seo-description`}
            multiline
            value={page.seoDescription ?? ''}
            maxLength={220}
            softMax={SEO_DESCRIPTION_SOFT_MAX}
            showCount
            placeholder={t('seoDescriptionPlaceholder')}
            onCommit={(seoDescription) => updatePage({ seoDescription })}
          />
        </div>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold">
            {t('sectionsTitle')} <span className="font-normal text-muted-foreground">({body.length})</span>
          </h4>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setLibraryOpen(true)}
            disabled={page.sections.length >= PLAN_LIMITS.sectionsPerPage}
          >
            <Plus className="size-3.5" />
            {t('addSection')}
          </Button>
        </div>

        {hasChrome && (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <PanelTop className="size-3.5" />
            {t('sharedChromeNote')}
          </p>
        )}

        {body.length === 0 ? (
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="flex w-full flex-col items-center gap-1 rounded-lg border border-dashed border-destructive/40 px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <Plus className="size-4" />
            {t('emptyPage')}
          </button>
        ) : (
          <ol className="space-y-1.5">
            {body.map((section, index) => (
              <PlanSectionCard
                key={section.id}
                section={section}
                index={index}
                pageId={page.id}
                collections={plan.cmsCollections ?? []}
                issues={issues.filter((i) => i.sectionId === section.id)}
                defaultOpen={section.id === focusSectionId}
                onRegenerate={onRegenerate}
                onOpenCollection={onOpenCollection}
              />
            ))}
          </ol>
        )}
      </section>

      <SectionLibraryDialog
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={(sectionId, type) => {
          // Before a trailing footer marker, so chrome stays last.
          const last = page.sections[page.sections.length - 1]
          const index = last && isChromePlanSection(last) && last.type !== 'navbar' ? page.sections.length - 1 : undefined
          apply({ op: 'section.add', pageId: page.id, section: { id: planId(), type, variant: sectionId }, index })
          setLibraryOpen(false)
        }}
      />
    </div>
  )
}

function IssueText ({ issue }: { issue: PlanIssue }) {
  const t = useTranslations('aiCreate.plan.issues')
  return <span dir="auto">{t(issue.code, issue.params)}</span>
}
