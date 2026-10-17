'use client'

import type { HTMLAttributes } from 'react'
import { cn } from '@workspace/ui/lib/utils'
import type { DndEdge } from './edge-store'

/**
 * Where a drop will land relative to the element it is rendered in: a caret on
 * one side, or a ring for "inside" / "refused".
 *
 * Absolutely positioned and `pointer-events-none`, so it never shifts layout or
 * steals the pointer. The host element must be positioned (`relative`).
 *
 * Colour comes from `--dnd-indicator`, falling back to the theme primary, so a
 * surface rendered inside a user's site theme (the builder canvas) can pin it
 * to the editor's own brand colour.
 */
export function DndDropIndicator ({
  edge,
  className,
  ...rest
}: Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  edge: DndEdge | null
}) {
  if (!edge) return null

  if (edge === 'center' || edge === 'reject') {
    return (
      <span
        aria-hidden
        data-drop-indicator={edge}
        {...rest}
        className={cn(
          'pointer-events-none absolute inset-0 z-[60] rounded-[inherit] ring-2 ring-inset',
          edge === 'center'
            ? 'bg-[color-mix(in_srgb,var(--dnd-indicator,var(--primary))_8%,transparent)] ring-[var(--dnd-indicator,var(--primary))]'
            : 'animate-builder-drop-reject bg-destructive/10 ring-destructive/70',
          className
        )}
      />
    )
  }

  const horizontal = edge === 'top' || edge === 'bottom'
  return (
    <span
      aria-hidden
      data-drop-indicator={edge}
      {...rest}
      className={cn(
        'pointer-events-none absolute z-[60] rounded-full bg-[var(--dnd-indicator,var(--primary))] shadow-[0_0_0_2px_color-mix(in_srgb,var(--dnd-indicator,var(--primary))_22%,transparent)]',
        horizontal ? 'inset-x-0 h-[3px]' : 'inset-y-0 w-[3px]',
        edge === 'top' && '-top-[2px]',
        edge === 'bottom' && '-bottom-[2px]',
        edge === 'left' && '-left-[2px]',
        edge === 'right' && '-right-[2px]',
        className
      )}
    />
  )
}
