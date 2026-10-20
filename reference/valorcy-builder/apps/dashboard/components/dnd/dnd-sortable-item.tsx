'use client'

import type { HTMLAttributes, ReactNode } from 'react'
import { useSortable, type UseSortableInput } from '@dnd-kit/react/sortable'
import type { Data } from '@dnd-kit/abstract'
import { closestCenter } from '@dnd-kit/collision'
import { DndHandleProvider } from './dnd-handle'
import { SORTABLE_TRANSITION } from './presets'

export interface DndItemState {
  isDragging: boolean
  isDropTarget: boolean
}

/** Drag-state attributes for styling with `data-[drag-source]:` / `data-[drop-target]:` variants. */
export function dragStateAttrs (state: { isDragSource?: boolean; isDropTarget?: boolean }) {
  return {
    'data-drag-source': state.isDragSource ? '' : undefined,
    'data-drop-target': state.isDropTarget ? '' : undefined,
  }
}

/**
 * `useSortable` with the dashboard's list defaults (closest-center collision,
 * shared reflow timing). Sortable items reflow *optimistically* — dnd-kit moves
 * the source's DOM node next to the target mid-drag — so items must be direct
 * DOM siblings: put wrappers such as `motion.div` inside the item, not around it.
 */
export function useDndSortable<T extends Data = Data> (input: UseSortableInput<T>) {
  return useSortable<T>({
    collisionDetector: closestCenter,
    transition: SORTABLE_TRANSITION,
    ...input,
  })
}

/**
 * A sortable row. `<DndHandle>` anywhere inside becomes its drag handle; without
 * one the whole row drags.
 */
export function DndSortableItem<T extends Data = Data> ({
  sortable,
  children,
  ...rest
}: Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  sortable: UseSortableInput<T>
  children: ReactNode | ((state: DndItemState) => ReactNode)
}) {
  const { ref, handleRef, isDragging, isDragSource, isDropTarget } = useDndSortable(sortable)
  return (
    <div ref={ref} {...dragStateAttrs({ isDragSource, isDropTarget })} {...rest}>
      <DndHandleProvider handleRef={handleRef}>
        {typeof children === 'function' ? children({ isDragging, isDropTarget }) : children}
      </DndHandleProvider>
    </div>
  )
}
