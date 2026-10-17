'use client'

import { useCallback, type ReactNode } from 'react'
import { isSortable } from '@dnd-kit/react/sortable'
import type { DragEndEvent } from '@dnd-kit/react'
import { DndProvider } from './dnd-provider'
import { useDndSortable } from './dnd-sortable-item'

/**
 * The index move a finished sortable drag describes, read from the *source*
 * (`initialIndex/index`, `initialGroup/group`) — never by comparing source and
 * target ids. `null` for cancelled drags, non-sortables and no-op drops.
 */
export function sortableMoveOf (
  event: Pick<DragEndEvent, 'canceled' | 'operation'>
): { from: number; to: number; group: string } | null {
  if (event.canceled) return null
  const source = event.operation.source
  if (!isSortable(source)) return null
  if (source.initialIndex === source.index && source.initialGroup === source.group) {
    return null
  }
  return { from: source.initialIndex, to: source.index, group: String(source.group ?? '') }
}

/**
 * A self-contained sortable list for surfaces that live outside the builder's
 * drag context (CMS schema editor, site planner wizard). Same sensors,
 * activation constraints and keyboard behaviour as every other surface.
 */
export function SortableListProvider ({
  onReorder,
  children,
}: {
  /**
   * Called once per drop with the source and destination indices. `group`
   * identifies which list moved, so one provider can host several independent
   * lists (e.g. the planner's pages column and sections column).
   */
  onReorder: (from: number, to: number, group: string) => void
  children: ReactNode
}) {
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const move = sortableMoveOf(event)
      if (move) onReorder(move.from, move.to, move.group)
    },
    [onReorder]
  )

  return <DndProvider onDragEnd={handleDragEnd}>{children}</DndProvider>
}

/** One row of a `SortableListProvider` list. Rows only sort within their own group. */
export function useSortableListItem ({
  id,
  index,
  group,
  disabled,
}: {
  id: string
  index: number
  /** Distinguishes multiple independent lists under one provider. */
  group: string
  disabled?: boolean
}) {
  return useDndSortable({
    id,
    index,
    group,
    type: group,
    accept: group,
    disabled,
  })
}
