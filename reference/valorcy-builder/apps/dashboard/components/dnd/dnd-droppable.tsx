'use client'

import type { HTMLAttributes, ReactNode } from 'react'
import { useDroppable, type UseDroppableInput } from '@dnd-kit/react'
import type { Data } from '@dnd-kit/abstract'
import { dragStateAttrs } from './dnd-sortable-item'

/** A drop zone. Style the hover state with the `data-[drop-target]:` variant. */
export function DndDroppable<T extends Data = Data> ({
  droppable,
  children,
  ...rest
}: Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  droppable: UseDroppableInput<T>
  children: ReactNode | ((state: { isDropTarget: boolean }) => ReactNode)
}) {
  const { ref, isDropTarget } = useDroppable(droppable)
  return (
    <div ref={ref} {...dragStateAttrs({ isDropTarget })} {...rest}>
      {typeof children === 'function' ? children({ isDropTarget }) : children}
    </div>
  )
}
