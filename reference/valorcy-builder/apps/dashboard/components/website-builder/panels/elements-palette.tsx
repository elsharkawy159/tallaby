'use client'

import { useMemo, useState } from 'react'
import { Search, LayoutTemplate, Bookmark, Trash2, Star, Clock, Flame } from 'lucide-react'
import { Input } from '@workspace/ui/components/input'
import { Badge } from '@workspace/ui/components/badge'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@workspace/ui/components/accordion'
import {
  ELEMENT_CATEGORY_LABELS,
  ELEMENT_CATEGORY_ORDER,
  ELEMENT_PALETTE_ITEMS,
  getPaletteItem,
  type ElementPaletteCategory,
  type ElementPaletteItem,
} from '@/lib/builder/element-definitions'
import { LAYOUT_PRESETS } from '@/lib/builder/layout-presets'
import { fuzzySearch } from '@/lib/builder/fuzzy-search'
import { mostUsed, toggleCategoryCollapsed } from '@/lib/builder/palette-prefs'
import { useBuilderStore } from '@/lib/builder/store'
import type { SavedBlockItem } from '@/lib/builder/store'
import { removeSavedBlockPersisted } from '@/lib/builder/saved-blocks-sync'
import { cn } from '@workspace/ui/lib/utils'
import { PaletteElementCard } from './palette-element-card'
import { usePalettePrefs } from './use-palette-prefs'

/** Pinned groups sit above the categories and are keyed apart from them. */
const PINNED = {
  favorites: '__favorites',
  recent: '__recent',
  mostUsed: '__most-used',
  layouts: '__layouts',
  saved: '__saved',
} as const

function LayoutPresetCard ({
  presetId,
  label,
  description,
}: {
  presetId: string
  label: string
  description: string
}) {
  const addComponentNode = useBuilderStore((s) => s.addComponentNode)
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId)

  function handleClick () {
    const sectionId = selectedSectionId
    if (!sectionId) return
    const preset = LAYOUT_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    const roots = preset.factory()
    for (const node of roots) {
      addComponentNode(sectionId, node)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={description}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg border border-border bg-card px-2 py-2 text-start shadow-sm transition-colors',
        'hover:border-primary/30 hover:bg-muted/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
        !selectedSectionId && 'cursor-not-allowed opacity-50',
      )}
      disabled={!selectedSectionId}
    >
      <LayoutTemplate className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
      <span className="text-xs font-medium leading-tight">{label}</span>
    </button>
  )
}

function SavedBlockCard ({ block }: { block: SavedBlockItem }) {
  const insertElementBlock = useBuilderStore((s) => s.insertElementBlock)
  const selectedSectionId = useBuilderStore((s) => s.selectedSectionId)

  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-card shadow-sm">
      <button
        type="button"
        title={`Insert "${block.name}" into selected section`}
        onClick={() => {
          if (selectedSectionId) insertElementBlock(block.id, selectedSectionId)
        }}
        disabled={!selectedSectionId}
        className={cn(
          'flex flex-1 items-center gap-2 px-2 py-2 text-start transition-colors',
          'hover:bg-muted/40 rounded-s-lg',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          !selectedSectionId && 'cursor-not-allowed opacity-50',
        )}
      >
        <Bookmark className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        <span className="text-xs font-medium leading-tight truncate">{block.name}</span>
      </button>
      <button
        type="button"
        title="Remove block"
        onClick={() => void removeSavedBlockPersisted(block.id)}
        className="me-1 rounded p-1 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Trash2 className="size-3" />
      </button>
    </div>
  )
}

/** A collapsible palette group. */
function PaletteGroup ({
  value,
  label,
  icon,
  count,
  children,
}: {
  value: string
  label: string
  icon?: React.ReactNode
  count: number
  children: React.ReactNode
}) {
  return (
    <AccordionItem value={value} className="border-b-0">
      <AccordionTrigger
        onClick={() => toggleCategoryCollapsed(value)}
        className="py-3 text-sm font-medium hover:no-underline"
      >
        <span className="flex flex-1 items-center gap-2 text-start">
          {icon}
          {label}
          <Badge variant="secondary" className="ms-auto">
            {count}
          </Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid grid-cols-1 gap-2 pb-2 sm:grid-cols-2">{children}</div>
      </AccordionContent>
    </AccordionItem>
  )
}

export function ElementsPalette () {
  const [q, setQ] = useState('')
  const prefs = usePalettePrefs()
  const allSavedBlocks = useBuilderStore((s) => s.savedBlocks)
  const savedBlocks = useMemo(
    () => allSavedBlocks.filter((b) => b.blockType === 'element'),
    [allSavedBlocks]
  )

  const query = q.trim()
  const searching = query.length > 0

  /**
   * Search results are a single relevance-ordered list rather than per-category
   * buckets: once a user is searching, the category an element happens to live
   * in is noise, and bucketing buries the best match below a heading.
   */
  const results = useMemo(
    () => (searching ? fuzzySearch(ELEMENT_PALETTE_ITEMS, query) : []),
    [searching, query]
  )

  const byCategory = useMemo(() => {
    const groups = new Map<ElementPaletteCategory, ElementPaletteItem[]>()
    for (const item of ELEMENT_PALETTE_ITEMS) {
      const list = groups.get(item.category)
      if (list) list.push(item)
      else groups.set(item.category, [item])
    }
    return ELEMENT_CATEGORY_ORDER.map((category) => ({
      category,
      items: groups.get(category) ?? [],
    })).filter((g) => g.items.length > 0)
  }, [])

  const favorites = useMemo(
    () => prefs.favorites.map(getPaletteItem).filter((i): i is ElementPaletteItem => !!i),
    [prefs.favorites]
  )
  const recent = useMemo(
    () => prefs.recent.map(getPaletteItem).filter((i): i is ElementPaletteItem => !!i),
    [prefs.recent]
  )
  const popular = useMemo(
    () =>
      mostUsed(prefs)
        .map(getPaletteItem)
        .filter((i): i is ElementPaletteItem => !!i)
        // Anything already pinned as a favourite would just be duplicated here.
        .filter((i) => !prefs.favorites.includes(i.paletteId)),
    [prefs]
  )

  const favoriteSet = useMemo(() => new Set(prefs.favorites), [prefs.favorites])

  /**
   * Accordion is controlled by the *expanded* set, derived from the persisted
   * collapsed list, so a reopened builder keeps the shape the user left behind.
   */
  const allGroupIds = useMemo(
    () => [
      PINNED.favorites,
      PINNED.recent,
      PINNED.mostUsed,
      PINNED.layouts,
      PINNED.saved,
      ...ELEMENT_CATEGORY_ORDER,
    ],
    []
  )
  const expanded = useMemo(
    () => allGroupIds.filter((id) => !prefs.collapsed.includes(id)),
    [allGroupIds, prefs.collapsed]
  )

  const card = (item: ElementPaletteItem, match?: (typeof results)[number]['match']) => (
    <PaletteElementCard
      key={item.paletteId}
      paletteId={item.paletteId}
      label={item.label}
      description={item.description}
      matchRanges={match?.ranges}
      matchedKeyword={match?.matchedKeyword}
      isFavorite={favoriteSet.has(item.paletteId)}
    />
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-3">
        <p className="mb-2 text-sm font-semibold">Elements</p>
        <div className="relative">
          <Search className="pointer-events-none absolute top-2.5 start-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search elements…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="ps-8"
            aria-label="Search elements"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {searching ? (
          <div className="px-2 pb-4 pt-3">
            {results.length === 0 ? (
              <p className="px-1 py-6 text-center text-xs text-muted-foreground">
                No elements match “{query}”.
              </p>
            ) : (
              <div
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                role="list"
                aria-label={`${results.length} matching elements`}
              >
                {results.map((r) => card(r, r.match))}
              </div>
            )}
          </div>
        ) : (
          <Accordion type="multiple" value={expanded} className="w-full px-2 pb-4">
            {favorites.length > 0 && (
              <PaletteGroup
                value={PINNED.favorites}
                label="Favorites"
                count={favorites.length}
                icon={<Star className="size-3.5 fill-current text-amber-500" />}
              >
                {favorites.map((item) => card(item))}
              </PaletteGroup>
            )}

            {recent.length > 0 && (
              <PaletteGroup
                value={PINNED.recent}
                label="Recent"
                count={recent.length}
                icon={<Clock className="size-3.5 text-muted-foreground" strokeWidth={1.75} />}
              >
                {recent.map((item) => card(item))}
              </PaletteGroup>
            )}

            {popular.length > 0 && (
              <PaletteGroup
                value={PINNED.mostUsed}
                label="Most Used"
                count={popular.length}
                icon={<Flame className="size-3.5 text-muted-foreground" strokeWidth={1.75} />}
              >
                {popular.map((item) => card(item))}
              </PaletteGroup>
            )}

            <PaletteGroup
              value={PINNED.layouts}
              label="Layouts"
              count={LAYOUT_PRESETS.length}
            >
              {LAYOUT_PRESETS.map((preset) => (
                <LayoutPresetCard
                  key={preset.id}
                  presetId={preset.id}
                  label={preset.label}
                  description={preset.description}
                />
              ))}
            </PaletteGroup>

            {savedBlocks.length > 0 && (
              <PaletteGroup
                value={PINNED.saved}
                label="Saved Blocks"
                count={savedBlocks.length}
              >
                {savedBlocks.map((block) => (
                  <SavedBlockCard key={block.id} block={block} />
                ))}
              </PaletteGroup>
            )}

            {byCategory.map(({ category, items }) => (
              <PaletteGroup
                key={category}
                value={category}
                label={ELEMENT_CATEGORY_LABELS[category]}
                count={items.length}
              >
                {items.map((item) => card(item))}
              </PaletteGroup>
            ))}
          </Accordion>
        )}
      </ScrollArea>
    </div>
  )
}
