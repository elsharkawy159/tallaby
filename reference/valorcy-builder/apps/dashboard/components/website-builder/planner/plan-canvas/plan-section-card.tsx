'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, Database, GripVertical, Loader2, RefreshCw, X } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { cn } from '@/lib/utils'
import { useSortableListItem } from '@/components/dnd/sortable-list'
import { useSitePlanStore } from '@/lib/ai/use-site-plan-store'
import { planSectionCategory } from '@/lib/ai/plan-functionality'
import {
  bindablePresetSlug,
  canBindToCollection,
  defaultCollectionForCategory,
} from '@/lib/ai/plan-cms'
import { planPartKey, type PlanPartTarget } from '@/lib/ai/plan-ops'
import type { PlanIssue } from '@/lib/ai/plan-validation'
import type { PlanCmsCollection, PlanSection } from '@/lib/ai/site-plan-schema'
import { DraftField, InlineEdit } from './inline-edit'
import { FieldLabel } from './plan-overview'
import { IssueIcon } from './plan-issues'
import { BODY_SECTION_CATEGORIES, planSectionLabel, templatesFor } from './plan-labels'

export const SECTIONS_GROUP_PREFIX = 'plan-sections:'

export function sectionsGroup (pageId: string): string {
  return `${SECTIONS_GROUP_PREFIX}${pageId}`
}

export function pageIdFromSectionsGroup (group: string): string | null {
  return group.startsWith(SECTIONS_GROUP_PREFIX) ? group.slice(SECTIONS_GROUP_PREFIX.length) : null
}

const NO_BINDING = '__none__'

interface PlanSectionCardProps {
  section: PlanSection
  index: number
  pageId: string
  collections: PlanCmsCollection[]
  issues: PlanIssue[]
  defaultOpen?: boolean
  onRegenerate: (target: PlanPartTarget) => void
  onOpenCollection: (collectionId: string) => void
}

export function PlanSectionCard ({
  section,
  index,
  pageId,
  collections,
  issues,
  defaultOpen,
  onRegenerate,
  onOpenCollection,
}: PlanSectionCardProps) {
  const t = useTranslations('aiCreate.plan.section')
  const tc = useTranslations('aiCreate.categories')
  const apply = useSitePlanStore((s) => s.apply)
  const target: PlanPartTarget = { kind: 'section', pageId, sectionId: section.id }
  const regenerating = useSitePlanStore((s) => s.busy.includes(planPartKey(target)))
  const [open, setOpen] = useState(Boolean(defaultOpen))
  const { ref, handleRef, isDragging } = useSortableListItem({
    id: section.id,
    index,
    group: sectionsGroup(pageId),
    disabled: regenerating,
  })

  const categoryLabel = (category: string) => (tc.has(category) ? tc(category) : category)
  const category = planSectionCategory(section)
  const label = planSectionLabel(section, categoryLabel)
  const templates = templatesFor(category)
  const bound = section.cmsBinding ? collections.find((c) => c.id === section.cmsBinding!.collectionId) : undefined
  const compatible = collections.filter((c) => canBindToCollection(category, c))
  const bindable = Boolean(bindablePresetSlug(category))
  const worst = issues.some((i) => i.severity === 'error') ? 'error' : issues.length ? 'warning' : null

  const update = (patch: Extract<Parameters<typeof apply>[0], { op: 'section.update' }>['patch']) =>
    apply({ op: 'section.update', pageId, sectionId: section.id, patch })

  function changeCategory (next: string) {
    if (next === category) return
    const variant = templatesFor(next)[0]?.id
    const keepBinding = bound && canBindToCollection(next, bound)
    update({ type: next, ...(variant ? { variant } : {}), ...(keepBinding ? {} : { cmsBinding: null }) })
  }

  function createCollectionAndBind () {
    const collection = defaultCollectionForCategory(category)
    if (!collection) return
    apply([
      { op: 'collection.add', collection },
      { op: 'section.update', pageId, sectionId: section.id, patch: { cmsBinding: { collectionId: collection.id } } },
    ])
  }

  const inputId = (name: string) => `section-${section.id}-${name}`

  return (
    <li
      ref={ref}
      className={cn(
        'group/section rounded-lg border bg-background transition-shadow',
        open && 'shadow-sm ring-1 ring-border',
        isDragging && 'opacity-60 shadow-lg',
        regenerating && 'animate-pulse'
      )}
    >
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <button
          type="button"
          ref={handleRef}
          aria-label={t('drag', { name: label })}
          className="shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GripVertical className="size-3.5" />
        </button>
        <span className="w-5 shrink-0 text-center text-[11px] tabular-nums text-muted-foreground">{index + 1}</span>
        <span className="hidden shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:inline">
          {categoryLabel(category)}
        </span>
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={label}
            onCommit={(v) => update({ label: v })}
            ariaLabel={t('rename', { name: label })}
            className="text-sm font-medium"
          />
          {!open && section.purpose && (
            <p className="truncate px-1.5 text-xs text-muted-foreground" dir="auto">
              {section.purpose}
            </p>
          )}
        </div>
        {bound && (
          <button
            type="button"
            onClick={() => onOpenCollection(bound.id)}
            className="hidden shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2 py-0.5 text-[11px] text-primary transition-colors hover:bg-primary/10 md:inline-flex"
          >
            <Database className="size-3" />
            <span className="max-w-28 truncate">{bound.name}</span>
          </button>
        )}
        {worst && <IssueIcon severity={worst} />}
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground"
          onClick={() => onRegenerate(target)}
          disabled={regenerating}
          aria-label={t('regenerate')}
          title={t('regenerate')}
        >
          {regenerating ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? t('collapse', { name: label }) : t('expand', { name: label })}
        >
          <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => apply({ op: 'section.remove', pageId, sectionId: section.id })}
          aria-label={t('remove', { name: label })}
        >
          <X className="size-3.5" />
        </Button>
      </div>

      {open && (
        <div className="grid gap-3 border-t px-3 py-3 sm:grid-cols-2">
          <div>
            <FieldLabel>{t('type')}</FieldLabel>
            <Select value={category} onValueChange={changeCategory}>
              <SelectTrigger className="h-8 w-full" aria-label={t('type')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BODY_SECTION_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {categoryLabel(c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <FieldLabel>{t('template')}</FieldLabel>
            <Select
              value={section.variant ?? ''}
              onValueChange={(variant) => update({ variant })}
              disabled={templates.length === 0}
            >
              <SelectTrigger className="h-8 w-full" aria-label={t('template')}>
                <SelectValue placeholder={t('templatePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((def) => (
                  <SelectItem key={def.id} value={def.id}>
                    {def.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor={inputId('purpose')}>{t('purpose')}</FieldLabel>
            <DraftField
              id={inputId('purpose')}
              value={section.purpose ?? ''}
              maxLength={240}
              placeholder={t('purposePlaceholder')}
              onCommit={(purpose) => update({ purpose })}
            />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor={inputId('content')}>{t('contentBrief')}</FieldLabel>
            <DraftField
              id={inputId('content')}
              multiline
              value={section.contentBrief ?? ''}
              maxLength={800}
              placeholder={t('contentBriefPlaceholder')}
              onCommit={(contentBrief) => update({ contentBrief })}
            />
          </div>
          <div>
            <FieldLabel htmlFor={inputId('image')}>{t('imageBrief')}</FieldLabel>
            <DraftField
              id={inputId('image')}
              value={section.imageBrief ?? ''}
              maxLength={300}
              placeholder={t('imageBriefPlaceholder')}
              onCommit={(imageBrief) => update({ imageBrief })}
            />
          </div>
          <div>
            <FieldLabel>{t('cms')}</FieldLabel>
            {!bindable ? (
              <p className="flex h-8 items-center text-xs text-muted-foreground">{t('cmsNotBindable')}</p>
            ) : compatible.length ? (
              <Select
                value={section.cmsBinding?.collectionId ?? NO_BINDING}
                onValueChange={(value) =>
                  update({ cmsBinding: value === NO_BINDING ? null : { collectionId: value } })
                }
              >
                <SelectTrigger className="h-8 w-full" aria-label={t('cms')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_BINDING}>{t('cmsNone')}</SelectItem>
                  {compatible.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button variant="outline" size="sm" className="h-8 w-full justify-start gap-1.5" onClick={createCollectionAndBind}>
                <Database className="size-3.5" />
                <span className="truncate">
                  {t('cmsCreate', { name: defaultCollectionForCategory(category)?.name ?? categoryLabel(category) })}
                </span>
              </Button>
            )}
          </div>
        </div>
      )}
    </li>
  )
}
