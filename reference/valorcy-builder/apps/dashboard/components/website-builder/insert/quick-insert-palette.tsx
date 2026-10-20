'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@workspace/ui/components/command'
import {
  ELEMENT_CATEGORY_LABELS,
  ELEMENT_PALETTE_ITEMS,
  getPaletteItem,
  type ElementPaletteItem,
} from '@/lib/builder/element-definitions'
import { fuzzySearch } from '@/lib/builder/fuzzy-search'
import { insertElement, type InsertTarget } from '@/lib/builder/insertion-engine'
import { mostUsed } from '@/lib/builder/palette-prefs'
import { PaletteIcon } from '@/components/website-builder/panels/palette-icon'
import { usePalettePrefs } from '@/components/website-builder/panels/use-palette-prefs'

/**
 * Where a Quick Insert should place the element. `undefined` means "wherever the
 * insertion engine decides", which is the ⌘K case; the slash command and the
 * Quick Add (+) affordance pass an explicit target.
 */
export interface QuickInsertRequest {
  target?: InsertTarget
}

/**
 * ⌘K element picker.
 *
 * Shares the palette's fuzzy matcher, icon registry and insertion engine, so a
 * ⌘K insert is indistinguishable from a click or a drag — including its effect
 * on Recent and Most Used. cmdk does its own filtering by default, which would
 * bypass our synonyms, so it is disabled (`shouldFilter={false}`) and the list
 * is ranked here instead.
 */
export function QuickInsertPalette ({
  open,
  onOpenChange,
  request,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  request?: QuickInsertRequest
}) {
  const [query, setQuery] = useState('')
  const prefs = usePalettePrefs()

  /**
   * Clear on close rather than on open. A stale query on reopen makes the
   * palette feel like it remembered the wrong thing — the target it was opened
   * for is what should persist, not the text — and resetting here keeps it out
   * of an effect, so opening the dialog costs one render instead of two.
   */
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setQuery('')
      onOpenChange(next)
    },
    [onOpenChange]
  )

  const suggestions = useMemo<ElementPaletteItem[]>(() => {
    const ids = [
      ...prefs.favorites,
      ...prefs.recent,
      ...mostUsed(prefs),
    ]
    const seen = new Set<string>()
    const out: ElementPaletteItem[] = []
    for (const id of ids) {
      if (seen.has(id)) continue
      seen.add(id)
      const item = getPaletteItem(id)
      if (item) out.push(item)
      if (out.length >= 6) break
    }
    return out
  }, [prefs])

  const results = useMemo(
    () => fuzzySearch(ELEMENT_PALETTE_ITEMS, query),
    [query]
  )

  const pick = useCallback(
    (paletteId: string) => {
      insertElement(paletteId, request?.target)
      handleOpenChange(false)
    },
    [request?.target, handleOpenChange]
  )

  const searching = query.trim().length > 0

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Insert element"
      description="Search for an element to insert"
      className="sm:max-w-lg"
    >
      <CommandInput
        placeholder="Insert an element…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No elements found.</CommandEmpty>

        {!searching && suggestions.length > 0 && (
          <CommandGroup heading="Suggested">
            {suggestions.map((item) => (
              <CommandItem
                key={item.paletteId}
                value={item.paletteId}
                onSelect={() => pick(item.paletteId)}
                className="gap-2"
              >
                <PaletteIcon paletteId={item.paletteId} chip={false} />
                <span className="flex-1">{item.label}</span>
                <CommandShortcut>
                  {ELEMENT_CATEGORY_LABELS[item.category]}
                </CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading={searching ? 'Results' : 'All elements'}>
          {results.map((item) => (
            <CommandItem
              key={item.paletteId}
              value={item.paletteId}
              onSelect={() => pick(item.paletteId)}
              className="gap-2"
            >
              <PaletteIcon paletteId={item.paletteId} chip={false} />
              <span className="flex-1">
                {item.label}
                {item.match.matchedKeyword ? (
                  <span className="ms-2 text-xs text-muted-foreground">
                    {item.match.matchedKeyword}
                  </span>
                ) : null}
              </span>
              <CommandShortcut>
                {ELEMENT_CATEGORY_LABELS[item.category]}
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
