'use client'

import { memo, useMemo } from 'react'
import { useDraggable } from '@dnd-kit/react'
import { Star } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import { DND_TYPE } from '@/lib/builder/dnd/types'
import { insertElement } from '@/lib/builder/insertion-engine'
import { toggleFavorite } from '@/lib/builder/palette-prefs'
import { highlightSegments, type MatchRange } from '@/lib/builder/fuzzy-search'
import { PaletteIcon } from './palette-icon'

/**
 * One element in the palette.
 *
 * Both a draggable and a button: dragging places the element precisely, and a
 * plain click inserts it at a sensible default target. Drag used to be the only
 * way in, which made adding an element to a deeply nested layout unnecessarily
 * fiddly and made the palette unusable by keyboard.
 *
 * Memoized because the palette re-renders on every keystroke in the search box;
 * without it, every card would rebuild its dnd-kit binding mid-search.
 */
export const PaletteElementCard = memo(function PaletteElementCard ({
  paletteId,
  label,
  description,
  matchRanges,
  matchedKeyword,
  isFavorite,
}: {
  paletteId: string
  label: string
  description?: string
  /** Character ranges in `label` to highlight, from the fuzzy matcher. */
  matchRanges?: MatchRange[]
  /** Set when a synonym matched instead of the label, e.g. "location" → Map. */
  matchedKeyword?: string
  isFavorite: boolean
}) {
  const { ref, isDragging } = useDraggable({
    id: `palette-element:${paletteId}`,
    // The blank-section entry creates a page section; everything else creates a
    // component-tree element, and the accept graph differs for the two.
    type: paletteId === 'section' ? DND_TYPE.section : DND_TYPE.element,
    // The card stays put; the builder's overlay chip follows the pointer.
    // Stable `data`: a new object each render makes dnd-kit re-render the
    // source on every frame of its own drag.
    data: useMemo(() => ({ drag: { source: 'element-palette', paletteId } }), [paletteId]),
  })

  const segments = highlightSegments(label, matchRanges ?? [])

  return (
    <div className="group/card relative">
      <button
        type="button"
        ref={ref}
        onClick={() => insertElement(paletteId)}
        title={description ?? label}
        aria-label={
          description ? `${label} — ${description}. Click to insert.` : `Insert ${label}`
        }
        className={cn(
          'flex w-full cursor-grab items-center gap-2 rounded-lg border border-border bg-card px-2 py-2 text-start shadow-sm transition-colors active:cursor-grabbing',
          'hover:border-primary/30 hover:bg-muted/40',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
          isDragging && 'opacity-60'
        )}
      >
        <PaletteIcon paletteId={paletteId} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium leading-tight">
            {segments.map((seg, i) =>
              seg.highlighted ? (
                <mark
                  key={i}
                  className="rounded-[2px] bg-primary/20 text-primary-foreground/90 dark:text-primary"
                >
                  {seg.text}
                </mark>
              ) : (
                <span key={i}>{seg.text}</span>
              )
            )}
          </span>
          {/* Explains a non-obvious hit: searching "location" surfacing Map. */}
          {matchedKeyword ? (
            <span className="block truncate text-[10px] leading-tight text-muted-foreground">
              {matchedKeyword}
            </span>
          ) : null}
        </span>
      </button>

      <button
        type="button"
        onClick={() => toggleFavorite(paletteId)}
        aria-label={isFavorite ? `Unstar ${label}` : `Star ${label}`}
        aria-pressed={isFavorite}
        className={cn(
          'absolute end-1 top-1 rounded p-1 text-muted-foreground transition-opacity',
          'hover:text-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          // Stars stay visible once set; unset ones appear on hover/focus so the
          // grid isn't peppered with empty outlines.
          isFavorite
            ? 'text-amber-500 opacity-100'
            : 'opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100'
        )}
      >
        <Star className={cn('size-3', isFavorite && 'fill-current')} />
      </button>
    </div>
  )
})
