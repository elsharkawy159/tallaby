'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Database, Loader2, Lock, Plus, RefreshCw, Trash2, X } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Input } from '@workspace/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { cn } from '@/lib/utils'
import { useSitePlanStore } from '@/lib/ai/use-site-plan-store'
import { planPartKey, type PlanPartTarget } from '@/lib/ai/plan-ops'
import { blankCollectionPlan, planId, sectionsBoundTo } from '@/lib/ai/plan-cms'
import type { PlanIssue, PlanValidation } from '@/lib/ai/plan-validation'
import {
  PLAN_CMS_FIELD_TYPES,
  PLAN_LIMITS,
  type PlanCmsCollection,
  type PlanCmsField,
  type WebsitePlan,
} from '@/lib/ai/site-plan-schema'
import { DraftField, InlineEdit } from './inline-edit'
import { FieldLabel } from './plan-overview'
import { IssueIcon } from './plan-issues'
import { planSectionLabel } from './plan-labels'

/** Field types offered when editing — references need real item ids, so they stay preset-only. */
const EDITABLE_FIELD_TYPES = PLAN_CMS_FIELD_TYPES.filter(
  (type) => type !== 'reference' && type !== 'multireference' && type !== 'slug'
)

interface PlanCmsProps {
  plan: WebsitePlan
  validation: PlanValidation
  selectedCollectionId: string | null
  onSelectCollection: (collectionId: string | null) => void
  onRegenerate: (target: PlanPartTarget) => void
  onOpenSection: (pageId: string, sectionId: string) => void
}

export function PlanCms ({
  plan,
  validation,
  selectedCollectionId,
  onSelectCollection,
  onRegenerate,
  onOpenSection,
}: PlanCmsProps) {
  const t = useTranslations('aiCreate.plan.cms')
  const apply = useSitePlanStore((s) => s.apply)
  const busyKeys = useSitePlanStore((s) => s.busy)
  const collections = plan.cmsCollections ?? []
  const selected = collections.find((c) => c.id === selectedCollectionId) ?? collections[0]
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  function addCollection (e?: FormEvent) {
    e?.preventDefault()
    const trimmed = name.trim()
    setName('')
    setAdding(false)
    if (!trimmed) return
    const collection = blankCollectionPlan(trimmed, collections)
    const result = apply({ op: 'collection.add', collection })
    if (result?.applied.length) onSelectCollection(collection.id)
  }

  const addForm = adding ? (
    <form onSubmit={addCollection}>
      <Input
        autoFocus
        value={name}
        maxLength={60}
        dir="auto"
        placeholder={t('newCollectionName')}
        aria-label={t('newCollectionName')}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => addCollection()}
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
      disabled={collections.length >= PLAN_LIMITS.collections}
    >
      <Plus className="size-3.5" />
      {t('addCollection')}
    </Button>
  )

  if (!selected) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Database className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium">{t('emptyTitle')}</p>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">{t('empty')}</p>
        </div>
        <div className="w-56">{addForm}</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <aside className="border-b bg-background/60 lg:w-64 lg:shrink-0 lg:border-e lg:border-b-0">
        <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('collections')}</h3>
          <span className="text-xs tabular-nums text-muted-foreground">
            {collections.length}/{PLAN_LIMITS.collections}
          </span>
        </div>
        <ul className="flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-visible">
          {collections.map((collection) => {
            const isSelected = collection.id === selected.id
            const hasError = validation.issues.some((i) => i.collectionId === collection.id && i.severity === 'error')
            const busy = busyKeys.includes(planPartKey({ kind: 'collection', collectionId: collection.id }))
            return (
              <li key={collection.id} className="min-w-44 lg:min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectCollection(collection.id)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected ? 'bg-muted' : 'hover:bg-muted/60'
                  )}
                >
                  {busy ? (
                    <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
                  ) : (
                    <Database className={cn('size-3.5 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate text-sm', isSelected && 'font-medium')} dir="auto">
                      {collection.name}
                    </span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {t('fieldCount', { count: collection.fields.length })} · {t('itemCount', { count: collection.sampleItems.length })}
                    </span>
                  </span>
                  {hasError && <IssueIcon severity="error" />}
                </button>
              </li>
            )
          })}
        </ul>
        <div className="px-2 pb-3">{addForm}</div>
      </aside>

      <div className="min-w-0 flex-1">
        <CollectionEditor
          key={selected.id}
          collection={selected}
          plan={plan}
          issues={validation.issues.filter((i) => i.collectionId === selected.id)}
          onRegenerate={onRegenerate}
          onOpenSection={onOpenSection}
          onRemoved={() => onSelectCollection(null)}
        />
      </div>
    </div>
  )
}

function CollectionEditor ({
  collection,
  plan,
  issues,
  onRegenerate,
  onOpenSection,
  onRemoved,
}: {
  collection: PlanCmsCollection
  plan: WebsitePlan
  issues: PlanIssue[]
  onRegenerate: (target: PlanPartTarget) => void
  onOpenSection: (pageId: string, sectionId: string) => void
  onRemoved: () => void
}) {
  const t = useTranslations('aiCreate.plan.cms')
  const tc = useTranslations('aiCreate.categories')
  const apply = useSitePlanStore((s) => s.apply)
  const target: PlanPartTarget = { kind: 'collection', collectionId: collection.id }
  const regenerating = useSitePlanStore((s) => s.busy.includes(planPartKey(target)))
  const usedBy = sectionsBoundTo(plan, collection.id)

  return (
    <div className={cn('mx-auto max-w-7xl space-y-5 p-4 sm:p-6', regenerating && 'pointer-events-none opacity-70')}>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Database className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <InlineEdit
            value={collection.name}
            onCommit={(name) => apply({ op: 'collection.update', collectionId: collection.id, patch: { name } })}
            ariaLabel={t('rename', { name: collection.name })}
            className="text-lg font-semibold tracking-tight"
          />
          <div className="mt-1 flex max-w-sm items-center gap-1.5 px-1.5" dir="ltr">
            {collection.presetSlug ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground" title={t('slugLocked')}>
                <Lock className="size-3" />
                {collection.slug}
              </span>
            ) : (
              <DraftField
                value={collection.slug}
                maxLength={60}
                aria-label={t('slug')}
                onCommit={(slug) => apply({ op: 'collection.update', collectionId: collection.id, patch: { slug } })}
                className="h-7 border-transparent bg-transparent px-1 font-mono text-xs shadow-none hover:border-input"
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onRegenerate(target)} disabled={regenerating}>
            {regenerating ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            {regenerating ? t('regenerating') : t('regenerate')}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-destructive"
            onClick={() => {
              apply({ op: 'collection.remove', collectionId: collection.id })
              onRemoved()
            }}
            aria-label={t('remove', { name: collection.name })}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {issues.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-dashed px-3 py-2">
          {issues.map((issue, i) => (
            <li key={`${issue.code}-${issue.fieldId ?? i}`} className="flex items-center gap-2 text-xs">
              <IssueIcon severity={issue.severity} />
              <IssueText issue={issue} />
            </li>
          ))}
        </ul>
      )}

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <FieldLabel htmlFor={`collection-${collection.id}-purpose`}>{t('purpose')}</FieldLabel>
          <DraftField
            id={`collection-${collection.id}-purpose`}
            value={collection.purpose ?? ''}
            maxLength={240}
            placeholder={t('purposePlaceholder')}
            onCommit={(purpose) => apply({ op: 'collection.update', collectionId: collection.id, patch: { purpose } })}
          />
        </div>
        <div>
          <FieldLabel>{t('usedBy')}</FieldLabel>
          {usedBy.length ? (
            <div className="flex flex-wrap gap-1.5">
              {usedBy.map(({ page, section, category }) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => onOpenSection(page.id, section.id)}
                  className="rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs transition-colors hover:border-primary hover:text-primary"
                  dir="auto"
                >
                  {page.name} › {planSectionLabel(section, (c) => (tc.has(c) ? tc(c) : c))}
                  <span className="sr-only"> ({category})</span>
                </button>
              ))}
            </div>
          ) : (
            <p className="flex h-8 items-center text-xs text-muted-foreground">{t('notUsed')}</p>
          )}
        </div>
      </div>

      <FieldsTable collection={collection} />
      <SampleItemsTable collection={collection} />
    </div>
  )
}

function FieldsTable ({ collection }: { collection: PlanCmsCollection }) {
  const t = useTranslations('aiCreate.plan.cms')
  const apply = useSitePlanStore((s) => s.apply)
  const update = (field: PlanCmsField, patch: Extract<Parameters<typeof apply>[0], { op: 'field.update' }>['patch']) =>
    apply({ op: 'field.update', collectionId: collection.id, fieldId: field.id, patch })

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <h4 className="text-sm font-semibold">
          {t('fields')} <span className="font-normal text-muted-foreground">({collection.fields.length})</span>
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          disabled={collection.fields.length >= PLAN_LIMITS.fields}
          onClick={() =>
            apply({
              op: 'field.add',
              collectionId: collection.id,
              field: { id: planId(), key: 'newField', label: t('newFieldLabel'), type: 'text' },
            })
          }
        >
          <Plus className="size-3.5" />
          {t('addField')}
        </Button>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-start text-xs text-muted-foreground">
              <th className="px-3 py-2 text-start font-medium">{t('fieldLabel')}</th>
              <th className="px-3 py-2 text-start font-medium">{t('fieldKey')}</th>
              <th className="w-36 px-3 py-2 text-start font-medium">{t('fieldType')}</th>
              <th className="w-20 px-3 py-2 text-center font-medium">{t('fieldRequired')}</th>
              <th className="px-3 py-2 text-start font-medium">{t('fieldOptions')}</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {collection.fields.map((field) => {
              const removable = !(field.locked && (field.required || field.type === 'slug'))
              const hasOptions = field.type === 'select' || field.type === 'multiselect'
              return (
                <tr key={field.id} className="border-b last:border-b-0">
                  <td className="px-3 py-1.5">
                    <DraftField
                      value={field.label}
                      maxLength={60}
                      aria-label={t('fieldLabel')}
                      onCommit={(label) => update(field, { label })}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center gap-1.5" title={field.locked ? t('lockedField') : undefined}>
                      {field.locked && <Lock className="size-3 shrink-0 text-muted-foreground" aria-label={t('lockedField')} />}
                      <DraftField
                        value={field.key}
                        maxLength={40}
                        disabled={field.locked}
                        aria-label={t('fieldKey')}
                        onCommit={(key) => update(field, { key })}
                        className="font-mono text-xs"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <Select
                      value={field.type}
                      disabled={field.locked}
                      onValueChange={(type) => update(field, { type: type as PlanCmsField['type'] })}
                    >
                      <SelectTrigger className="h-8 w-full" aria-label={t('fieldType')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {((EDITABLE_FIELD_TYPES as readonly string[]).includes(field.type)
                          ? EDITABLE_FIELD_TYPES
                          : [field.type, ...EDITABLE_FIELD_TYPES]
                        ).map((type) => (
                          <SelectItem key={type} value={type}>
                            {t(`fieldTypes.${type}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <Checkbox
                      checked={Boolean(field.required)}
                      disabled={field.locked}
                      onCheckedChange={(checked) => update(field, { required: checked === true })}
                      aria-label={t('fieldRequired')}
                    />
                  </td>
                  <td className="px-3 py-1.5">
                    {hasOptions ? (
                      <DraftField
                        value={(field.options ?? []).join(', ')}
                        maxLength={600}
                        placeholder={t('optionsPlaceholder')}
                        aria-label={t('fieldOptions')}
                        onCommit={(value) => update(field, { options: value.split(',') })}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      disabled={!removable}
                      onClick={() => apply({ op: 'field.remove', collectionId: collection.id, fieldId: field.id })}
                      aria-label={t('removeField', { name: field.label || field.key })}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SampleItemsTable ({ collection }: { collection: PlanCmsCollection }) {
  const t = useTranslations('aiCreate.plan.cms')
  const apply = useSitePlanStore((s) => s.apply)
  const columns = collection.fields.filter(
    (f) => f.type !== 'slug' && f.type !== 'reference' && f.type !== 'multireference' && f.type !== 'richtext'
  )

  return (
    <section className="rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold">
            {t('samples')} <span className="font-normal text-muted-foreground">({collection.sampleItems.length})</span>
          </h4>
          <p className="text-xs text-muted-foreground">{t('samplesHint')}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 gap-1.5"
          disabled={collection.sampleItems.length >= PLAN_LIMITS.sampleItems}
          onClick={() => apply({ op: 'item.add', collectionId: collection.id, item: { id: planId(), values: {} } })}
        >
          <Plus className="size-3.5" />
          {t('addItem')}
        </Button>
      </header>
      {collection.sampleItems.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">{t('noSamples')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: `${Math.max(640, columns.length * 170)}px` }}>
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                {columns.map((field) => (
                  <th key={field.id} className="px-3 py-2 text-start font-medium" dir="auto">
                    {field.label || field.key}
                  </th>
                ))}
                <th className="w-10 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {collection.sampleItems.map((item, index) => (
                <tr key={item.id} className="border-b align-top last:border-b-0">
                  {columns.map((field) => {
                    const value = item.values[field.key]
                    const set = (next: string | number | boolean | null) =>
                      apply({ op: 'item.update', collectionId: collection.id, itemId: item.id, values: { [field.key]: next } })
                    return (
                      <td key={field.id} className="px-3 py-1.5">
                        {field.type === 'boolean' ? (
                          <Checkbox
                            checked={value === true}
                            onCheckedChange={(checked) => set(checked === true)}
                            aria-label={field.label}
                            className="mt-2"
                          />
                        ) : field.type === 'number' || field.type === 'price' ? (
                          <DraftField
                            value={value === undefined ? '' : String(value)}
                            inputMode="decimal"
                            aria-label={field.label}
                            onCommit={(raw) => {
                              const n = Number(raw.replace(/[^0-9.-]/g, ''))
                              set(raw.trim() === '' ? null : Number.isFinite(n) ? n : null)
                            }}
                            className="tabular-nums"
                          />
                        ) : (
                          <DraftField
                            value={value === undefined ? '' : String(value)}
                            maxLength={field.type === 'textarea' ? 2000 : 300}
                            multiline={field.type === 'textarea'}
                            type={field.type === 'image' || field.type === 'url' ? 'url' : 'text'}
                            placeholder={field.type === 'image' ? t('imagePlaceholder') : undefined}
                            aria-label={field.label}
                            onCommit={(next) => set(next.trim() === '' ? null : next)}
                          />
                        )}
                      </td>
                    )
                  })}
                  <td className="px-2 py-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => apply({ op: 'item.remove', collectionId: collection.id, itemId: item.id })}
                      aria-label={t('removeItem', { index: index + 1 })}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function IssueText ({ issue }: { issue: PlanIssue }) {
  const t = useTranslations('aiCreate.plan.issues')
  return <span dir="auto">{t(issue.code, issue.params)}</span>
}
