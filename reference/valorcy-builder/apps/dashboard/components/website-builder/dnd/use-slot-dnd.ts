'use client'

import { useMemo } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/react'
import { innermostPointerCollision } from '@/lib/builder/dnd/collision'
import { slotBlockId, slotDropId } from '@/lib/builder/dnd/ids'
import {
  DND_TYPE,
  DROP_PRIORITY,
  type BuilderEntityData,
  type DropTargetData,
  type SlotRule,
} from '@/lib/builder/dnd/types'
import type { CompiledSlot } from '@/components/sections/schema/compile-schema'
import { useBuilderAccept } from './use-tree-node-dnd'
import { useMergedRefs } from './use-merged-refs'

const slotRules = new Map<string, SlotRule>()

/**
 * A slot's acceptance rule as an interned object: equal rules share one
 * identity, so memoized slot entries don't re-render when the slot does.
 * Interned rather than `useMemo`'d because slot components resolve their slot
 * after an early return.
 */
export function slotRuleOf (
  slot: Pick<CompiledSlot, 'acceptsElements' | 'max'>,
  entryCount: number
): SlotRule {
  const key = `${slot.acceptsElements}|${slot.max}|${entryCount}`
  let rule = slotRules.get(key)
  if (!rule) {
    rule = { acceptsElements: slot.acceptsElements, max: slot.max, entryCount }
    slotRules.set(key, rule)
  }
  return rule
}

/**
 * A section slot as a drop destination. Ranked with the other section-level
 * surfaces: an element dropped on a hero lands in the region the user aimed at
 * rather than at the section root, but the entries inside the slot still win.
 */
export function useDroppableSlot ({
  sectionId,
  slotId,
  rule,
  disabled,
}: {
  sectionId: string
  slotId: string
  rule: SlotRule
  disabled?: boolean
}) {
  const target = useMemo<DropTargetData>(
    () => ({ kind: 'slot', sectionId, slotId, rule }),
    [sectionId, slotId, rule]
  )
  return useDroppable<BuilderEntityData>({
    id: slotDropId(sectionId, slotId),
    type: DND_TYPE.element,
    accept: useBuilderAccept(target),
    collisionDetector: innermostPointerCollision,
    collisionPriority: DROP_PRIORITY.sectionSurface,
    disabled,
    data: useMemo(() => ({ drop: target }), [target]),
  })
}

/**
 * One schema block inside a slot: draggable (reorders within its slot) and a
 * drop target (things land before/after it). Shares the slot's list with the
 * slot's free elements, so a dropped Button can sit between the badge and the
 * headline.
 */
export function useSlotBlockDnd ({
  sectionId,
  slotId,
  blockId,
  rule,
  disabled,
}: {
  sectionId: string
  slotId: string
  blockId: string
  rule: SlotRule
  disabled?: boolean
}) {
  const id = slotBlockId(sectionId, slotId, blockId)
  const target = useMemo<DropTargetData>(
    () => ({ kind: 'slot-block', sectionId, slotId, blockId, rule }),
    [sectionId, slotId, blockId, rule]
  )

  const draggable = useDraggable<BuilderEntityData>({
    id,
    type: DND_TYPE.element,
    disabled,
    data: useMemo(
      () => ({ drag: { source: 'slot-block', sectionId, slotId, blockId } }),
      [sectionId, slotId, blockId]
    ),
  })
  const droppable = useDroppable<BuilderEntityData>({
    id,
    type: DND_TYPE.element,
    accept: useBuilderAccept(target),
    collisionDetector: innermostPointerCollision,
    collisionPriority: DROP_PRIORITY.treeNode,
    disabled,
    data: useMemo(() => ({ drop: target }), [target]),
  })

  return {
    id,
    ref: useMergedRefs(draggable.ref, droppable.ref),
    get isDragSource () {
      return draggable.isDragSource
    },
  }
}
