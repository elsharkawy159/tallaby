'use client'

import type { HTMLAttributes, ReactNode } from 'react'
import { useDraggable, type UseDraggableInput } from '@dnd-kit/react'
import type { Data } from '@dnd-kit/abstract'
import { DndHandleProvider } from './dnd-handle'
import { dragStateAttrs } from './dnd-sortable-item'

/** A plain draggable (a palette entry, a card). `<DndHandle>` inside becomes its handle. */
export function DndDraggable<T extends Data = Data> ({
  draggable,
  children,
  ...rest
}: Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  draggable: UseDraggableInput<T>
  children: ReactNode | ((state: { isDragging: boolean }) => ReactNode)
}) {
  const { ref, handleRef, isDragging, isDragSource } = useDraggable(draggable)
  return (
    <div ref={ref} {...dragStateAttrs({ isDragSource })} {...rest}>
      <DndHandleProvider handleRef={handleRef}>
        {typeof children === 'function' ? children({ isDragging }) : children}
      </DndHandleProvider>
    </div>
  )
}
