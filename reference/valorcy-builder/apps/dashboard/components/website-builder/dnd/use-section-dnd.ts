'use client'

import { useMemo } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/react'
import { useSortable } from '@dnd-kit/react/sortable'
import {
  canvasRootCollision,
  innermostPointerCollision,
  sectionCollision,
} from '@/lib/builder/dnd/collision'
import {
  CANVAS_DROP_ID,
  sectionRootId,
  sectionSortableId,
  sectionsGroupId,
  sharedChromeDragId,
  type DndSurface,
} from '@/lib/builder/dnd/ids'
import {
  DND_TYPE,
  DROP_PRIORITY,
  type BuilderEntityData,
  type DropTargetData,
} from '@/lib/builder/dnd/types'
import { SORTABLE_TRANSITION } from '@/components/dnd/presets'
import { useBuilderAccept } from './use-tree-node-dnd'

/**
 * A page section on the canvas (or a section row in the navigator).
 *
 * One entity: `useSortable` registers both the draggable and the droppable
 * under this id. On the canvas the section is also a sink for elements that
 * are not over anything more specific, and an insertion point for new sections
 * (top/bottom half decides before/after).
 */
export function useSortableSection ({
  instanceId,
  index,
  disabled,
  surface = 'canvas',
}: {
  instanceId: string
  index: number
  disabled?: boolean
  /** The navigator mirrors the canvas and needs its own id/group namespace. */
  surface?: DndSurface
}) {
  const target = useMemo<DropTargetData>(
    () => ({ kind: 'section', sectionId: instanceId, surface }),
    [instanceId, surface]
  )
  return useSortable<BuilderEntityData>({
    id: sectionSortableId(instanceId, surface),
    index,
    group: sectionsGroupId(surface),
    type: DND_TYPE.section,
    accept: useBuilderAccept(target),
    collisionDetector: sectionCollision,
    collisionPriority: DROP_PRIORITY.section,
    transition: SORTABLE_TRANSITION,
    disabled,
    data: useMemo(
      () => ({ drag: { source: 'canvas', sectionInstanceId: instanceId, surface }, drop: target }),
      [instanceId, surface, target]
    ),
  })
}

/** The placeholder of an empty custom section — drops land in its component tree root. */
export function useDroppableSectionRoot ({
  sectionId,
  disabled,
}: {
  sectionId: string
  disabled?: boolean
}) {
  const target = useMemo<DropTargetData>(() => ({ kind: 'section-root', sectionId }), [sectionId])
  return useDroppable<BuilderEntityData>({
    id: sectionRootId(sectionId),
    type: DND_TYPE.element,
    accept: useBuilderAccept(target),
    collisionDetector: innermostPointerCollision,
    collisionPriority: DROP_PRIORITY.sectionSurface,
    disabled,
    data: useMemo(() => ({ drop: target }), [target]),
  })
}

const CANVAS_TARGET: DropTargetData = { kind: 'canvas' }
const CANVAS_DATA: BuilderEntityData = { drop: CANVAS_TARGET }

/**
 * The page background behind the section list. Lowest priority — it only wins
 * when the pointer is genuinely over empty canvas.
 */
export function useDroppableCanvasRoot () {
  return useDroppable<BuilderEntityData>({
    id: CANVAS_DROP_ID,
    type: DND_TYPE.section,
    accept: useBuilderAccept(CANVAS_TARGET),
    collisionDetector: canvasRootCollision,
    collisionPriority: DROP_PRIORITY.canvas,
    data: CANVAS_DATA,
  })
}

/** The shared header/footer, dragged by its handle out of the pinned slot into the page flow. */
export function useSharedChromeDrag (role: 'header' | 'footer') {
  return useDraggable<BuilderEntityData>({
    id: sharedChromeDragId(role),
    type: DND_TYPE.section,
    data: useMemo(
      () => ({ drag: { source: role === 'header' ? 'shared-header' : 'shared-footer' } }),
      [role]
    ),
  })
}
