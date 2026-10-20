'use client'

import { useMemo } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'
import { listCollision } from '@/lib/builder/dnd/collision'
import {
  chromeComponentsGroupId,
  chromeComponentSortableId,
  navItemsGroupId,
  navItemSortableId,
  PAGES_GROUP,
  pageSortableId,
} from '@/lib/builder/dnd/ids'
import { DND_TYPE, type BuilderEntityData, type DropTargetData } from '@/lib/builder/dnd/types'
import { SORTABLE_TRANSITION } from '@/components/dnd/presets'
import { useBuilderAccept } from './use-tree-node-dnd'

/**
 * Builder panel lists. They live inside the builder's drag context, so they
 * resolve through the same `resolveBuilderDrop` → `applyBuilderDropAction`
 * pipeline as the canvas, and each list's `accept` keeps it from ever colliding
 * with a section or element drop.
 */

/** A page row in the Pages panel. */
export function useSortablePage ({ pageId, index }: { pageId: string; index: number }) {
  const target = useMemo<DropTargetData>(() => ({ kind: 'page', pageId }), [pageId])
  return useSortable<BuilderEntityData>({
    id: pageSortableId(pageId),
    index,
    group: PAGES_GROUP,
    type: DND_TYPE.page,
    accept: useBuilderAccept(target),
    collisionDetector: listCollision,
    transition: SORTABLE_TRANSITION,
    data: useMemo<BuilderEntityData>(
      () => ({ drag: { source: 'page', pageId }, drop: target }),
      [pageId, target]
    ),
  })
}

/**
 * A navigation row in the shared navbar/footer inspector. The nesting tree is
 * dragged as one flattened list — depth comes from the horizontal drag offset
 * at drop time, which is what makes "drag right to nest" feel natural.
 */
export function useSortableNavItem ({
  role,
  navId,
  index,
  disabled,
}: {
  role: 'header' | 'footer'
  navId: string
  index: number
  disabled?: boolean
}) {
  const target = useMemo<DropTargetData>(() => ({ kind: 'nav-item', role, navId }), [role, navId])
  return useSortable<BuilderEntityData>({
    id: navItemSortableId(role, navId),
    index,
    group: navItemsGroupId(role),
    type: DND_TYPE.navItem,
    accept: useBuilderAccept(target),
    collisionDetector: listCollision,
    transition: SORTABLE_TRANSITION,
    disabled,
    data: useMemo<BuilderEntityData>(
      () => ({ drag: { source: 'nav-item', role, navId }, drop: target }),
      [role, navId, target]
    ),
  })
}

/** A built-in chrome component row (logo, cart, theme toggle, …). Single level. */
export function useSortableChromeComponent ({
  role,
  componentId,
  index,
}: {
  role: 'header' | 'footer'
  componentId: string
  index: number
}) {
  const target = useMemo<DropTargetData>(
    () => ({ kind: 'chrome-component', role, componentId }),
    [role, componentId]
  )
  return useSortable<BuilderEntityData>({
    id: chromeComponentSortableId(role, componentId),
    index,
    group: chromeComponentsGroupId(role),
    type: DND_TYPE.chromeComponent,
    accept: useBuilderAccept(target),
    collisionDetector: listCollision,
    transition: SORTABLE_TRANSITION,
    data: useMemo<BuilderEntityData>(
      () => ({ drag: { source: 'chrome-component', role, componentId }, drop: target }),
      [role, componentId, target]
    ),
  })
}
