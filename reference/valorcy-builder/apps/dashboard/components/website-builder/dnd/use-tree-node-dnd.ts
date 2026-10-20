'use client'

import { useCallback, useMemo } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/react'
import type { Draggable } from '@dnd-kit/abstract'
import type { ShadcnComponentType } from '@/lib/builder/component-node'
import { canDrop } from '@/lib/builder/dnd/can-drop'
import { innermostPointerCollision } from '@/lib/builder/dnd/collision'
import { emptySlotId, treeNodeId } from '@/lib/builder/dnd/ids'
import {
  asDragPayload,
  DND_TYPE,
  DROP_PRIORITY,
  type BuilderEntityData,
  type DropTargetData,
  type SlotRule,
  type TreeNodePayload,
} from '@/lib/builder/dnd/types'
import { useMergedRefs } from './use-merged-refs'

/** `accept` predicate for a builder droppable: the single rule table, nothing else. */
export function useBuilderAccept (target: DropTargetData) {
  return useCallback(
    (source: Draggable) => canDrop(asDragPayload(source.data), target),
    [target]
  )
}

interface TreeNodeInput {
  sectionId: string
  nodeId: string
  nodeType: ShadcnComponentType
  /** Parent list: a node id, `null` for the section root, or a bucket parent. */
  parentId: string | null
  /** Parent component type; `null` for the root and bucket parents. */
  parentType: ShadcnComponentType | null
  /** Set when the parent list is a slot. */
  parentSlot?: SlotRule
  /** Ids from the tree root down to (and including) this node. */
  path: readonly string[]
  childCount: number
}

function useTreeNodeTarget (
  input: TreeNodeInput,
  surface: 'canvas' | 'navigator'
): DropTargetData {
  const { sectionId, nodeId, nodeType, parentId, parentType, parentSlot, path, childCount } = input
  const slotAccepts = parentSlot?.acceptsElements
  const slotMax = parentSlot?.max
  const slotCount = parentSlot?.entryCount
  return useMemo(
    () => ({
      kind: 'tree-node',
      sectionId,
      nodeId,
      nodeType,
      parentId,
      parentType,
      ...(slotCount !== undefined
        ? { parentSlot: { acceptsElements: slotAccepts, max: slotMax, entryCount: slotCount } }
        : {}),
      path,
      childCount,
      surface,
    }),
    [sectionId, nodeId, nodeType, parentId, parentType, slotAccepts, slotMax, slotCount, path, childCount, surface]
  )
}

function useTreeNodePayload (input: TreeNodeInput): TreeNodePayload {
  const { sectionId, nodeId, nodeType, parentId } = input
  return useMemo(
    () => ({ source: 'tree-node', sectionId, nodeId, nodeType, parentId }),
    [sectionId, nodeId, nodeType, parentId]
  )
}

/**
 * A component-tree node — on the canvas, or as a navigator row: one draggable
 * and one droppable on the same element.
 *
 * Tree nodes use the *edge* model rather than a sortable. Nested lists are a
 * poor fit for live reflow: optimistic sorting moves DOM nodes between parents
 * React owns, which breaks reconciliation. Instead the drop lands relative to
 * the hovered node — inside it at its center (containers only), before/after it
 * at its edges, or (canvas only) wrapped into a new row at the left/right of a
 * column child. The provider computes the edge centrally; the node's indicator
 * shows it.
 */
export function useTreeNodeDnd (
  input: TreeNodeInput & { disabled?: boolean; surface?: 'canvas' | 'navigator' }
) {
  const surface = input.surface ?? 'canvas'
  const id = treeNodeId(input.sectionId, input.nodeId, surface)
  const payload = useTreeNodePayload(input)
  const target = useTreeNodeTarget(input, surface)
  const accept = useBuilderAccept(target)

  const draggable = useDraggable<BuilderEntityData>({
    id,
    type: DND_TYPE.element,
    disabled: input.disabled,
    data: useMemo(() => ({ drag: payload }), [payload]),
  })

  const droppable = useDroppable<BuilderEntityData>({
    id,
    type: DND_TYPE.element,
    accept,
    collisionDetector: innermostPointerCollision,
    collisionPriority: DROP_PRIORITY.treeNode,
    disabled: input.disabled,
    data: useMemo(() => ({ drop: target }), [target]),
  })

  return {
    id,
    ref: useMergedRefs(draggable.ref, droppable.ref),
    handleRef: draggable.handleRef,
    get isDragSource () {
      return draggable.isDragSource
    },
    get isDropTarget () {
      return droppable.isDropTarget
    },
  }
}

/**
 * The "Drop elements here" surface inside an empty container — a real target,
 * and the smallest one under the pointer, so it wins over the container itself.
 */
export function useDroppableEmptySlot ({
  sectionId,
  nodeId,
  nodeType,
  path,
  disabled,
}: {
  sectionId: string
  nodeId: string
  nodeType: ShadcnComponentType
  path: readonly string[]
  disabled?: boolean
}) {
  const target = useMemo<DropTargetData>(
    () => ({ kind: 'empty-slot', sectionId, nodeId, nodeType, path }),
    [sectionId, nodeId, nodeType, path]
  )
  return useDroppable<BuilderEntityData>({
    id: emptySlotId(sectionId, nodeId),
    type: DND_TYPE.element,
    accept: useBuilderAccept(target),
    collisionDetector: innermostPointerCollision,
    collisionPriority: DROP_PRIORITY.treeNode,
    disabled,
    data: useMemo(() => ({ drop: target }), [target]),
  })
}
