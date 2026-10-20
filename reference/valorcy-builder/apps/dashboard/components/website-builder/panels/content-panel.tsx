'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import type { ComponentNode } from '@/lib/builder/component-node'
import { Database, ExternalLink, ImageIcon, Loader2, Sparkles, Unplug } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Textarea } from '@workspace/ui/components/textarea'
import { Switch } from '@workspace/ui/components/switch'
import { Label } from '@workspace/ui/components/label'
import { Separator } from '@workspace/ui/components/separator'
import { MediaLibraryDialog } from '@/components/website-builder/media/media-library-dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@workspace/ui/components/accordion'
import { ColorInput, StyleSelect, LinkPicker } from '@/components/website-builder/controls'
import { useBuilderStore } from '@/lib/builder/store'
import { sectionRegistry } from '@/components/sections'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@workspace/ui/components/select'
import { getSectionBinding } from '@/lib/cms/section-bindings'
import {
  findSortOption,
  getBindingForDataSource,
  getPresentationPropDefinitions,
  getSortOptionsForBinding,
  isCmsBoundCollection,
  pickPresentationFields,
  sortOptionKey,
} from '@/lib/cms/data-source-utils'
import {
  ensureCmsCollectionForSection,
  fetchSectionCmsItems,
  getSectionCmsItemCount,
} from '@/actions/cms/section-binding-actions'
import type {
  ComponentPropDefinition,
  ItemCollectionDefinition,
  SectionDataSource,
  SectionDefinition,
  SectionMeta,
} from '@/components/sections/registry.types'
import { FIELD_GROUP_LABELS, type FieldGroup } from '@/components/sections/registry.constants'
import { SlotOutline } from '@/components/website-builder/panels/slot-outline'
import { ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react'
import {
  rewriteSectionContentAction,
  findSectionImagesAction,
} from '@/actions/website-ai-section-actions'
import {
  isElementScopeEmpty,
  resolveElementContentScope,
  scopeHasFieldType,
  type ElementContentScope,
} from '@/lib/builder/element-content-scope'
import {
  FORM_EMBED_SECTION_ID,
  FormEmbedPicker,
} from '@/components/website-builder/panels/forms-panel'

const TEXT_FIELD_TYPES = new Set<ComponentPropDefinition['type']>(['text', 'textarea'])
const IMAGE_FIELD_TYPES = new Set<ComponentPropDefinition['type']>(['image'])

function stripFunctions<T extends object> (obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === 'function' ? undefined : v)))
}

/** Section metadata narrowed to the fields in `scope` (optionally only certain field types). */
function scopedSectionMeta (
  def: SectionDefinition,
  scope: ElementContentScope,
  types?: ReadonlySet<ComponentPropDefinition['type']>
): SectionMeta {
  const meta = stripFunctions(def) as SectionMeta
  const keep = (p: ComponentPropDefinition) => !types || types.has(p.type)
  return {
    ...meta,
    imageRequired: types ? types.has('image') && meta.imageRequired : meta.imageRequired,
    propDefinitions: meta.propDefinitions.filter((p) => scope.propKeys.includes(p.key) && keep(p)),
    itemCollections: (meta.itemCollections ?? [])
      .filter((c) => scope.items[c.key])
      .map((c) => {
        const byIndex = scope.items[c.key] ?? {}
        const lists = Object.values(byIndex)
        const wholeItem = lists.some((k) => k.length === 0)
        const keys = new Set(lists.flat())
        return {
          ...c,
          itemPropDefinitions: (c.itemPropDefinitions ?? []).filter(
            (ipd) => (wholeItem || keys.has(ipd.key)) && keep(ipd)
          ),
        }
      }),
  }
}

/**
 * Applies only the in-scope part of an AI patch: top-level keys in the scope and,
 * for collections, just the scoped items / item fields.
 */
function applyScopedPatch (
  instanceId: string,
  currentProps: Record<string, unknown>,
  patch: Record<string, unknown>,
  scope: ElementContentScope,
  allowedKey: (key: string, collectionKey?: string) => boolean,
  store: {
    updateSectionProps: (id: string, p: Record<string, unknown>) => void
    updateItem: (id: string, col: string, index: number, p: Record<string, unknown>) => void
  }
): number {
  let applied = 0
  const sectionPatch: Record<string, unknown> = {}
  for (const key of scope.propKeys) {
    if (key in patch && allowedKey(key)) {
      sectionPatch[key] = patch[key]
      applied++
    }
  }
  if (Object.keys(sectionPatch).length > 0) store.updateSectionProps(instanceId, sectionPatch)

  for (const [colKey, byIndex] of Object.entries(scope.items)) {
    const next = patch[colKey]
    const current = currentProps[colKey]
    if (!Array.isArray(next) || !Array.isArray(current)) continue
    for (const [indexStr, keys] of Object.entries(byIndex)) {
      const index = Number(indexStr)
      const nextItem = next[index] as Record<string, unknown> | undefined
      const currentItem = current[index] as Record<string, unknown> | undefined
      if (!nextItem || !currentItem) continue
      const itemPatch: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(nextItem)) {
        if (keys.length > 0 && !keys.includes(k)) continue
        if (!allowedKey(k, colKey)) continue
        if (JSON.stringify(v) !== JSON.stringify(currentItem[k])) itemPatch[k] = v
      }
      if (Object.keys(itemPatch).length > 0) {
        store.updateItem(instanceId, colKey, index, itemPatch)
        applied++
      }
    }
  }
  return applied
}

function DataSourcePanel({
  sectionId,
  instanceId,
  dataSource,
  projectId,
}: {
  sectionId: string
  instanceId: string
  dataSource: SectionDataSource | undefined
  projectId: string | null
}) {
  const updateSectionProps = useBuilderStore((s) => s.updateSectionProps)
  const [connecting, setConnecting] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const limitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const binding = getSectionBinding(sectionId)
  const sortOptions = useMemo(() => getSortOptionsForBinding(binding), [binding])
  const sortEnabled = Boolean(dataSource?.sortBy)
  const itemLimit = dataSource?.itemLimit ?? 9
  const showPaginationToggle = totalItems > itemLimit

  async function refreshFromCms (nextDs: SectionDataSource) {
    if (!projectId || !nextDs.collectionId || !nextDs.category || !nextDs.itemsPropKey) return
    const { items, total } = await fetchSectionCmsItems({
      projectId,
      collectionId: nextDs.collectionId,
      category: nextDs.category,
      itemLimit: nextDs.itemLimit ?? 9,
      sortBy: nextDs.sortBy,
      sortDir: nextDs.sortDir,
    })
    setTotalItems(total)
    if (items.length > 0) {
      const template = nextDs.itemTemplate ?? {}
      const merged = items.map((item) => ({ ...template, ...item }))
      updateSectionProps(instanceId, { [nextDs.itemsPropKey]: merged })
    }
  }

  function scheduleRefresh (nextDs: SectionDataSource) {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => {
      refreshFromCms(nextDs).catch(() => {})
    }, 600)
  }

  function patchDataSource (patch: Partial<SectionDataSource>): SectionDataSource | null {
    if (!dataSource) return null
    const next = { ...dataSource, ...patch } satisfies SectionDataSource
    updateSectionProps(instanceId, { dataSource: next })
    return next
  }

  useEffect(() => {
    if (!dataSource?.collectionId || !projectId) {
      setTotalItems(0)
      return
    }
    getSectionCmsItemCount({ projectId, collectionId: dataSource.collectionId })
      .then(setTotalItems)
      .catch(() => {})
  }, [dataSource?.collectionId, projectId])

  // Refresh canvas items from CMS when the user returns to this tab (e.g. after editing a record)
  useEffect(() => {
    if (!binding || !dataSource || !projectId) return
    function onVisibilityChange () {
      if (document.visibilityState !== 'visible' || !dataSource || !dataSource.category || !projectId) return
      refreshFromCms(dataSource).catch(() => {})
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [dataSource, projectId, instanceId, binding])

  if (!binding) return null

  async function handleConnect () {
    if (!projectId || !binding) return
    setConnecting(true)
    try {
      const result = await ensureCmsCollectionForSection({ projectId, sectionId, category: binding.category })
      if (result.ok) {
        const patch: Record<string, unknown> = {
          dataSource: {
            type: 'cms_collection',
            collectionId: result.collectionId,
            collectionSlug: result.collectionSlug,
            category: binding.category,
            itemsPropKey: result.itemsPropKey,
            itemLimit: result.mappedItems.length || 9,
          } satisfies SectionDataSource,
        }
        if (result.mappedItems.length > 0) {
          patch[result.itemsPropKey] = result.mappedItems
        }
        updateSectionProps(instanceId, patch)
        setTotalItems(result.mappedItems.length)
        toast.success(
          result.created
            ? `Created ${result.collectionName} collection with demo data`
            : `Connected to ${result.collectionName} collection`,
        )
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error('Failed to connect collection.')
    } finally {
      setConnecting(false)
    }
  }

  function handleDisconnect () {
    updateSectionProps(instanceId, { dataSource: undefined })
    setTotalItems(0)
    toast.success('Data source disconnected.')
  }

  function handleLimitChange (value: number) {
    if (!dataSource) return
    const clamped = Math.max(1, Math.min(50, value))
    const next = patchDataSource({ itemLimit: clamped })
    if (!next) return
    if (limitTimerRef.current) clearTimeout(limitTimerRef.current)
    limitTimerRef.current = setTimeout(() => {
      refreshFromCms(next).catch(() => {})
    }, 600)
  }

  function handleSortToggle (enabled: boolean) {
    if (!dataSource) return
    if (!enabled) {
      const next = patchDataSource({ sortBy: undefined, sortDir: undefined })
      if (next) scheduleRefresh(next)
      return
    }
    const defaultOpt =
      sortOptions.find((o) => o.sortBy === 'publishedAt' && o.sortDir === 'desc') ??
      sortOptions[1] ??
      sortOptions[0]
    if (!defaultOpt) return
    const next = patchDataSource({ sortBy: defaultOpt.sortBy, sortDir: defaultOpt.sortDir })
    if (next) scheduleRefresh(next)
  }

  function handleSortOptionChange (key: string) {
    const opt = sortOptions.find((o) => sortOptionKey(o) === key)
    if (!opt || !dataSource) return
    const next = patchDataSource({ sortBy: opt.sortBy, sortDir: opt.sortDir })
    if (next) scheduleRefresh(next)
  }

  function handlePaginateToggle (enabled: boolean) {
    patchDataSource({ paginate: enabled })
  }

  const activeSortKey = dataSource?.sortBy
    ? sortOptionKey(
        findSortOption(sortOptions, dataSource.sortBy, dataSource.sortDir) ??
          sortOptions[0]!
      )
    : sortOptionKey(sortOptions[0]!)

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <Database className="size-3.5" />
        Data Source
      </div>

      {dataSource ? (
        <>
          <p className="text-xs text-foreground">
            Connected to{' '}
            <span className="font-medium">{binding.collectionName}</span>
            {totalItems > 0 ? (
              <span className="text-muted-foreground"> · {totalItems} items</span>
            ) : null}
          </p>

          <div className="flex flex-col gap-1">
            <Label htmlFor="ds-item-limit" className="text-xs">Item limit</Label>
            <Input
              id="ds-item-limit"
              type="number"
              min={1}
              max={50}
              value={itemLimit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="h-7 text-xs"
            />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="ds-sort-toggle" className="text-xs">Sort items</Label>
            <Switch
              id="ds-sort-toggle"
              checked={sortEnabled}
              onCheckedChange={handleSortToggle}
            />
          </div>

          {sortEnabled ? (
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Sort by</Label>
              <Select value={activeSortKey} onValueChange={handleSortOptionChange}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Choose sort order" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={sortOptionKey(opt)} value={sortOptionKey(opt)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {showPaginationToggle ? (
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ds-paginate-toggle" className="text-xs">Add pagination</Label>
              <Switch
                id="ds-paginate-toggle"
                checked={Boolean(dataSource.paginate)}
                onCheckedChange={handlePaginateToggle}
              />
            </div>
          ) : null}

          <div className="flex gap-2">
            {projectId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                asChild
              >
                <a
                  href={`/projects/${projectId}/cms/${dataSource.collectionSlug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-3" />
                  Open collection
                </a>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
              onClick={handleDisconnect}
            >
              <Unplug className="size-3" />
              Disconnect
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Connect to the <span className="font-medium">{binding.collectionName}</span> collection to show live content.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 w-full gap-1.5 text-xs"
            disabled={connecting || !projectId}
            onClick={handleConnect}
          >
            {connecting ? <Loader2 className="size-3 animate-spin" /> : <Database className="size-3" />}
            Connect to {binding.collectionName}
          </Button>
        </>
      )}
    </div>
  )
}

function collectTextNodes(tree: ComponentNode[]): ComponentNode[] {
  const result: ComponentNode[] = []
  for (const node of tree) {
    if (typeof node.props.text === "string") result.push(node)
    result.push(...collectTextNodes(node.children))
  }
  return result
}

function buildLabels(nodes: ComponentNode[]): Record<string, string> {
  const counts: Record<string, number> = {}
  const labels: Record<string, string> = {}
  for (const node of nodes) {
    counts[node.type] = (counts[node.type] ?? 0) + 1
    const typeLabel = node.type.charAt(0).toUpperCase() + node.type.slice(1)
    labels[node.id] = typeLabel + " " + counts[node.type]
  }
  return labels
}

function itemLabelPreview (item: Record<string, unknown>, col: ItemCollectionDefinition, index: number) {
  const keys = col.itemPropDefinitions?.map((d) => d.key) ?? []
  for (const k of keys) {
    const v = item[k]
    if (typeof v === 'string' && v.trim()) {
      return v.trim().length > 40 ? `${v.trim().slice(0, 40)}…` : v.trim()
    }
  }
  return `${col.label} ${index + 1}`
}

function ImagePropField ({
  def,
  value,
  projectId,
  onChange,
}: {
  def: ComponentPropDefinition
  value: unknown
  projectId: string | null
  onChange: (v: unknown) => void
}) {
  const [open, setOpen] = useState(false)
  const str = value === undefined || value === null ? '' : String(value)

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={def.key}>{def.label}</Label>
      {projectId ? (
        <>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full gap-2 text-xs"
            onClick={() => setOpen(true)}
          >
            <ImageIcon className="size-3.5" />
            Choose from library
          </Button>
          <MediaLibraryDialog
            open={open}
            onOpenChange={setOpen}
            projectId={projectId}
            previousUrl={str}
            onCommit={(url) => onChange(url)}
          />
        </>
      ) : null}
      <Input
        id={def.key}
        value={str}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def.placeholder ?? 'Image URL'}
        type="url"
        className="font-mono text-[11px]"
      />
    </div>
  )
}

function FieldHelp ({ def, value }: { def: ComponentPropDefinition; value: unknown }) {
  const str = typeof value === 'string' ? value : ''
  const over = def.maxLength != null && str.length > def.maxLength
  if (!def.aiHint && def.maxLength == null) return null
  return (
    <div className="flex items-start justify-between gap-2 text-[11px] leading-tight">
      {def.aiHint ? (
        <span className="text-muted-foreground">{def.aiHint}</span>
      ) : <span />}
      {def.maxLength != null ? (
        <span className={over ? 'text-amber-600' : 'text-muted-foreground'}>
          {str.length}/{def.maxLength}
        </span>
      ) : null}
    </div>
  )
}

function PropField ({
  def,
  value,
  projectId,
  onChange
}: {
  def: ComponentPropDefinition
  value: unknown
  projectId: string | null
  onChange: (v: unknown) => void
}) {
  const str = value === undefined || value === null ? '' : String(value)

  if (def.type === 'image') {
    return (
      <ImagePropField
        def={def}
        value={value}
        projectId={projectId}
        onChange={onChange}
      />
    )
  }
  if (def.type === 'textarea') {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={def.key}>{def.label}{def.required ? <span className="text-destructive"> *</span> : null}</Label>
        <Textarea
          id={def.key}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
        />
        <FieldHelp def={def} value={value} />
      </div>
    )
  }
  if (def.type === 'switch') {
    return (
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={def.key}>{def.label}</Label>
        <Switch id={def.key} checked={Boolean(value)} onCheckedChange={onChange} />
      </div>
    )
  }
  if (def.type === 'number') {
    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={def.key}>{def.label}</Label>
        <Input
          id={def.key}
          type="number"
          value={typeof value === 'number' ? value : str}
          min={def.min}
          max={def.max}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    )
  }
  if (def.type === 'color') {
    return (
      <ColorInput
        id={def.key}
        label={def.label}
        value={str}
        onValueChange={(v) => onChange(v || undefined)}
      />
    )
  }
  if (def.type === 'select' && def.options) {
    return (
      <StyleSelect
        id={def.key}
        label={def.label}
        value={str}
        onValueChange={(v) => onChange(v)}
        options={def.options}
        allowEmpty={false}
        emptyLabel="Choose"
      />
    )
  }
  if (def.type === 'url') {
    return (
      <LinkPicker
        id={def.key}
        label={def.label}
        value={value}
        onChange={onChange}
      />
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={def.key}>{def.label}{def.required ? <span className="text-destructive"> *</span> : null}</Label>
      <Input
        id={def.key}
        value={str}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def.placeholder}
        type="text"
      />
      <FieldHelp def={def} value={value} />
    </div>
  )
}

export function ContentPanel ({ elementId = null }: { elementId?: string | null } = {}) {
  const projectId = useBuilderStore((s) => s.projectId)
  const pageId = useBuilderStore((s) => s.pageId)
  const builderLocale = useBuilderStore((s) => s.builderLocale)
  const storeSelectedSectionId = useBuilderStore((s) => s.selectedSectionId)
  const sections = useBuilderStore((s) => s.sections)
  // With an element selected, edit the section that element lives in.
  const elementSep = elementId ? elementId.indexOf('::') : -1
  const selectedSectionId =
    elementId && elementSep > 0 ? elementId.slice(0, elementSep) : storeSelectedSectionId
  const updateSectionProps = useBuilderStore((s) => s.updateSectionProps)
  const updateComponentNodeProps = useBuilderStore((s) => s.updateComponentNodeProps)
  const addItem = useBuilderStore((s) => s.addItem)
  const updateItem = useBuilderStore((s) => s.updateItem)
  const updateAllItems = useBuilderStore((s) => s.updateAllItems)
  const removeItem = useBuilderStore((s) => s.removeItem)
  const duplicateItem = useBuilderStore((s) => s.duplicateItem)
  const reorderItems = useBuilderStore((s) => s.reorderItems)
  const setSectionAiLoading = useBuilderStore((s) => s.setSectionAiLoading)

  const [rewriteLoading, setRewriteLoading] = useState(false)
  const [imagesLoading, setImagesLoading] = useState(false)

  const instance = sections.find((s) => s.id === selectedSectionId)
  const def = instance ? sectionRegistry.get(instance.sectionId) : undefined

  const hasImageSlots = !!(
    def?.propDefinitions?.some((p) => p.type === 'image') ||
    def?.itemCollections?.some((c) => c.itemPropDefinitions?.some((p) => p.type === 'image'))
  )

  // ── Element scope ─────────────────────────────────────────────────────────
  // When an element (not the whole section) is selected, only its own content
  // fields are shown and the AI actions only touch those fields. Resolved once
  // per selection — re-resolving on every keystroke would drop a text field the
  // moment its value stops matching the rendered DOM.
  const [scope, setScope] = useState<ElementContentScope | null>(null)
  const [showAllContent, setShowAllContent] = useState(false)
  const instanceId = instance?.id
  const defId = def?.id

  useEffect(() => {
    setShowAllContent(false)
    if (!elementId || !instanceId || !defId) {
      setScope(null)
      return
    }
    const liveDef = sectionRegistry.get(defId)
    const liveInstance = useBuilderStore.getState().sections.find((s) => s.id === instanceId)
    if (!liveDef || !liveInstance) {
      setScope(null)
      return
    }
    setScope(resolveElementContentScope({ elementId, def: liveDef, props: liveInstance.props }))
  }, [elementId, instanceId, defId])

  const scoped = Boolean(elementId && scope && !showAllContent)
  const activeScope = scoped ? scope : null

  const scopeHasText = activeScope && def ? scopeHasFieldType(activeScope, def, TEXT_FIELD_TYPES) : false
  const scopeHasImages = activeScope && def ? scopeHasFieldType(activeScope, def, IMAGE_FIELD_TYPES) : false
  const canRewrite = activeScope ? scopeHasText : true
  const canFindImages = activeScope ? scopeHasImages : hasImageSlots

  async function handleRewriteWithAI () {
    if (!instance || !def || !projectId || !pageId) return
    setRewriteLoading(true)
    setSectionAiLoading(instance.id, 'writing')
    try {
      const siblingCategories = sections
        .flatMap((s) => {
          const d = sectionRegistry.get(s.sectionId)
          return d?.category ? [d.category as string] : []
        })
      const result = await rewriteSectionContentAction({
        projectId,
        pageId,
        sectionMeta: activeScope ? scopedSectionMeta(def, activeScope, TEXT_FIELD_TYPES) : stripFunctions(def),
        currentProps: instance.props,
        locale: builderLocale,
        position: sections.findIndex((s) => s.id === instance.id),
        siblingCategories,
      })
      if ('error' in result) {
        toast.error(result.error)
      } else if (activeScope) {
        const textKeys = new Set([
          ...def.propDefinitions.filter((p) => TEXT_FIELD_TYPES.has(p.type)).map((p) => p.key),
        ])
        const itemTextKeys = new Map(
          (def.itemCollections ?? []).map((c) => [
            c.key,
            new Set((c.itemPropDefinitions ?? []).filter((p) => TEXT_FIELD_TYPES.has(p.type)).map((p) => p.key)),
          ])
        )
        const applied = applyScopedPatch(
          instance.id,
          instance.props,
          result.patch,
          activeScope,
          (key, col) => (col ? itemTextKeys.get(col)?.has(key) ?? false : textKeys.has(key)),
          { updateSectionProps, updateItem }
        )
        if (applied > 0) toast.success('Element content rewritten.')
        else toast.info('No new copy was generated for this element. Try again.')
      } else {
        updateSectionProps(instance.id, result.patch)
        toast.success('Section content rewritten.')
      }
    } catch {
      toast.error('Failed to rewrite content.')
    } finally {
      setRewriteLoading(false)
      setSectionAiLoading(instance.id, null)
    }
  }

  async function handleFindImagesWithAI () {
    if (!instance || !def || !projectId) return
    setImagesLoading(true)
    setSectionAiLoading(instance.id, 'images')
    try {
      const result = await findSectionImagesAction({
        projectId,
        sectionMeta: activeScope ? scopedSectionMeta(def, activeScope, IMAGE_FIELD_TYPES) : stripFunctions(def),
        currentProps: instance.props,
        pageId: pageId ?? undefined,
        locale: builderLocale,
      })
      if ('error' in result) {
        toast.error(result.error)
      } else if (activeScope) {
        const imageKeys = new Set(def.propDefinitions.filter((p) => p.type === 'image').map((p) => p.key))
        const itemImageKeys = new Map(
          (def.itemCollections ?? []).map((c) => [
            c.key,
            new Set((c.itemPropDefinitions ?? []).filter((p) => p.type === 'image').map((p) => p.key)),
          ])
        )
        const applied = applyScopedPatch(
          instance.id,
          instance.props,
          result.patch,
          activeScope,
          (key, col) => (col ? itemImageKeys.get(col)?.has(key) ?? false : imageKeys.has(key)),
          { updateSectionProps, updateItem }
        )
        if (applied > 0) toast.success('Image updated.')
        else toast.info('No new image was found for this element. Try again.')
      } else {
        updateSectionProps(instance.id, result.patch)
        toast.success('Images updated.')
      }
    } catch {
      toast.error('Failed to find images.')
    } finally {
      setImagesLoading(false)
      setSectionAiLoading(instance.id, null)
    }
  }

  if (!instance) {
    return <p className="text-sm text-muted-foreground">Select a section to edit content.</p>
  }

  if (instance.sectionId === "custom") {
    const tree = instance.componentTree ?? (instance.props.componentTree as ComponentNode[] | undefined) ?? []
    const textNodes = collectTextNodes(tree)
    const labels = buildLabels(textNodes)
    if (textNodes.length === 0) {
      return (
        <p className="text-sm text-muted-foreground px-1 py-2">
          No editable text fields — add a text element to the canvas.
        </p>
      )
    }
    return (
      <div className="flex flex-col gap-4 px-1 py-2">
        {textNodes.map((node) => (
          <div key={node.id} className="flex flex-col gap-2">
            <Label htmlFor={node.id}>{labels[node.id]}</Label>
            <Input
              id={node.id}
              value={String(node.props.text ?? "")}
              placeholder="Enter text..."
              onChange={(e) =>
                updateComponentNodeProps(instance.id, node.id, { text: e.target.value })
              }
            />
          </div>
        ))}
      </div>
    )
  }

  if (!def) {
    return <p className="text-sm text-muted-foreground">Select a section to edit content.</p>
  }

  const visibleDefs = activeScope
    ? def.propDefinitions.filter((pd) => activeScope.propKeys.includes(pd.key))
    : def.propDefinitions
  const visibleCollections = activeScope
    ? (def.itemCollections ?? []).filter((c) => activeScope.items[c.key])
    : def.itemCollections ?? []
  const isItemVisible = (colKey: string, index: number) =>
    !activeScope || activeScope.items[colKey]?.[index] !== undefined
  const isItemFieldVisible = (colKey: string, index: number, key: string) => {
    if (!activeScope) return true
    const keys = activeScope.items[colKey]?.[index]
    return Boolean(keys) && (keys!.length === 0 || keys!.includes(key))
  }
  const scopeEmpty = activeScope ? isElementScopeEmpty(activeScope) : false

  const hasGroups = visibleDefs.some((pd) => Boolean(pd.group))
  const GROUP_ORDER: FieldGroup[] = ['content', 'media', 'cta', 'layout', 'appearance']
  const grouped: Partial<Record<FieldGroup, ComponentPropDefinition[]>> = {}
  const ungrouped: ComponentPropDefinition[] = []
  if (hasGroups) {
    for (const pd of visibleDefs) {
      if (pd.group) {
        ;(grouped[pd.group] ??= []).push(pd)
      } else {
        ungrouped.push(pd)
      }
    }
  }

  const dataSource = instance.props.dataSource as SectionDataSource | undefined

  return (
    <div className="flex flex-col gap-4 px-1 py-2">
      {elementId && scope ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5">
          <p className="text-[11px] text-muted-foreground">
            {scoped ? 'Selected element only' : 'All section content'}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px]"
            onClick={() => setShowAllContent((v) => !v)}
          >
            {scoped ? 'Show all' : 'Selected only'}
          </Button>
        </div>
      ) : null}
      {!activeScope && instance.sectionId === FORM_EMBED_SECTION_ID ? (
        <FormEmbedPicker instanceId={instance.id} formId={String(instance.props.formId ?? '')} />
      ) : null}
      {!activeScope ? (
        <DataSourcePanel
          sectionId={instance.sectionId}
          instanceId={instance.id}
          dataSource={dataSource}
          projectId={projectId}
        />
      ) : null}
      {/* Structure first: what the section is made of, before what it says.
          Hidden only while scoped to one element, where it would be noise. */}
      {!activeScope && def.slots?.length ? (
        <SlotOutline instance={instance} def={def} />
      ) : null}
      {scopeEmpty ? (
        <p className="text-sm text-muted-foreground">
          This element has no editable content fields. Use the Style tab, or choose “Show all” to edit the whole section.
        </p>
      ) : null}
      {projectId && (canRewrite || canFindImages) && !scopeEmpty && (
        <div className="flex flex-col gap-1.5">
          {canRewrite && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full gap-2 text-xs"
              disabled={rewriteLoading || imagesLoading}
              onClick={handleRewriteWithAI}
            >
              {rewriteLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Sparkles className="size-3.5" />
              )}
              Rewrite with AI
            </Button>
          )}
          {canFindImages && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full gap-2 text-xs"
              disabled={rewriteLoading || imagesLoading}
              onClick={handleFindImagesWithAI}
            >
              {imagesLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ImageIcon className="size-3.5" />
              )}
              Find Images with AI
            </Button>
          )}
        </div>
      )}
      {!hasGroups
        ? visibleDefs.map((pd) => (
            <PropField
              key={pd.key}
              def={pd}
              projectId={projectId}
              value={instance.props[pd.key]}
              onChange={(v) => updateSectionProps(instance.id, { [pd.key]: v })}
            />
          ))
        : (
          <Accordion type="multiple" defaultValue={GROUP_ORDER.filter((g) => grouped[g])} className="w-full">
            {GROUP_ORDER.filter((g) => grouped[g]).map((g) => (
              <AccordionItem key={g} value={g}>
                <AccordionTrigger className="py-2 text-start text-sm">
                  {FIELD_GROUP_LABELS[g]}
                </AccordionTrigger>
                <AccordionContent className="flex flex-col gap-3 pt-1">
                  {grouped[g]!.map((pd) => (
                    <PropField
                      key={pd.key}
                      def={pd}
                      projectId={projectId}
                      value={instance.props[pd.key]}
                      onChange={(v) => updateSectionProps(instance.id, { [pd.key]: v })}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
            {ungrouped.length > 0 ? (
              <AccordionItem value="other">
                <AccordionTrigger className="py-2 text-start text-sm">Other</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-3 pt-1">
                  {ungrouped.map((pd) => (
                    <PropField
                      key={pd.key}
                      def={pd}
                      projectId={projectId}
                      value={instance.props[pd.key]}
                      onChange={(v) => updateSectionProps(instance.id, { [pd.key]: v })}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            ) : null}
          </Accordion>
        )}

      {visibleCollections.map((col) => {
        const items = (instance.props[col.key] as Record<string, unknown>[]) ?? []
        const firstScopedIndex = activeScope
          ? Object.keys(activeScope.items[col.key] ?? {}).map(Number).sort((a, b) => a - b)[0]
          : undefined
        const cmsBound = isCmsBoundCollection(dataSource, col.key)
        const cmsBinding = getBindingForDataSource(dataSource)

        if (cmsBound) {
          const presentationDefs = getPresentationPropDefinitions(cmsBinding, col.itemPropDefinitions)
          const template = {
            ...pickPresentationFields(items[0], presentationDefs),
            ...(dataSource?.itemTemplate ?? {}),
          } as Record<string, unknown>

          const handleTemplateChange = (key: string, value: unknown) => {
            if (!dataSource) return
            const base = {
              ...pickPresentationFields(items[0], presentationDefs),
              ...(dataSource.itemTemplate ?? {}),
            }
            const nextTemplate = { ...base, [key]: value }
            updateSectionProps(instance.id, {
              dataSource: { ...dataSource, itemTemplate: nextTemplate } satisfies SectionDataSource,
            })
            updateAllItems(instance.id, col.key, { [key]: value })
          }

          return (
            <div key={col.key} className="flex flex-col gap-3">
              <Separator />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Item template</p>
                <p className="text-xs text-muted-foreground">
                  Style fields apply to every item. Edit content in the CMS collection.
                </p>
              </div>
              {presentationDefs.length > 0 ? (
                presentationDefs.map((ipd) => (
                  <PropField
                    key={`template-${col.key}-${ipd.key}`}
                    def={ipd}
                    projectId={projectId}
                    value={template[ipd.key]}
                    onChange={(v) => handleTemplateChange(ipd.key, v)}
                  />
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No shared style fields for this section. Content is managed in CMS.
                </p>
              )}
              {projectId && dataSource?.collectionSlug ? (
                <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" asChild>
                  <a
                    href={`/projects/${projectId}/cms/${dataSource.collectionSlug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-3" />
                    Open collection to edit items
                  </a>
                </Button>
              ) : null}
            </div>
          )
        }

        return (
          <div key={col.key} className="flex flex-col gap-3">
            <Separator />
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">{col.label}</p>
              {!activeScope ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => addItem(instance.id, col.key)}
                >
                  Add
                </Button>
              ) : null}
            </div>
            <Accordion
              type="single"
              collapsible
              defaultValue={firstScopedIndex !== undefined ? `${col.key}-${firstScopedIndex}` : undefined}
              className="w-full rounded-md border border-border px-2"
            >
              {items.map((item, index) => !isItemVisible(col.key, index) ? null : (
                <AccordionItem key={`${col.key}-${index}`} value={`${col.key}-${index}`}>
                  <AccordionTrigger className="py-2 text-start text-sm">
                    {itemLabelPreview(item, col, index)}
                  </AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-2 border-b-0 pb-3">
                    <div className="flex flex-wrap gap-2">
                      {index > 0 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Move item up"
                          onClick={() =>
                            reorderItems(instance.id, col.key, index, index - 1)
                          }
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                      )}
                      {index < items.length - 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          aria-label="Move item down"
                          onClick={() =>
                            reorderItems(instance.id, col.key, index, index + 1)
                          }
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Remove item"
                        onClick={() => removeItem(instance.id, col.key, index)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Duplicate item"
                        onClick={() => duplicateItem(instance.id, col.key, index)}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                    {(col.itemPropDefinitions ?? []).filter((ipd) => isItemFieldVisible(col.key, index, ipd.key)).map((ipd) => (
                      <PropField
                        key={`${col.key}-${index}-${ipd.key}`}
                        def={ipd}
                        projectId={projectId}
                        value={item[ipd.key]}
                        onChange={(v) =>
                          updateItem(instance.id, col.key, index, { [ipd.key]: v })
                        }
                      />
                    ))}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )
      })}
    </div>
  )
}
