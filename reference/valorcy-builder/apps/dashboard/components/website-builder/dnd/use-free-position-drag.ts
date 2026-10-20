'use client'

import { useMemo } from 'react'
import { useDraggable } from '@dnd-kit/react'
import type { ShadcnComponentType } from '@/lib/builder/component-node'
import { useBuilderStore } from '@/lib/builder/store'
import { SnapToGuides, setSnapBreakpointReader } from '@/lib/builder/dnd/snap-modifier'
import { freeNodeId } from '@/lib/builder/dnd/ids'
import { DND_TYPE, type BuilderEntityData } from '@/lib/builder/dnd/types'

// The modifier reads the active breakpoint through a setter rather than
// importing the store, keeping `lib/builder/dnd` free of a store dependency.
setSnapBreakpointReader(() => useBuilderStore.getState().activeBreakpoint)

/** Module constant — re-creating this array would rebuild the modifier each render. */
const FREE_MODIFIERS = [SnapToGuides]

/**
 * Free positioning for absolutely positioned nodes: a plain draggable plus the
 * `SnapToGuides` modifier. It shares the editor's sensors, keyboard support and
 * cancel semantics.
 *
 * A free drag has no drop targets (its `free-node` payload is accepted by
 * nothing), so it causes no collision work; the landing position is committed
 * centrally from live geometry, producing one undo entry like every other drop.
 */
export function useFreePositionDrag ({
  sectionId,
  nodeId,
  nodeType,
  enabled,
}: {
  sectionId: string
  nodeId: string
  nodeType: ShadcnComponentType
  enabled: boolean
}) {
  return useDraggable<BuilderEntityData>({
    id: freeNodeId(sectionId, nodeId),
    type: DND_TYPE.freeNode,
    disabled: !enabled,
    modifiers: FREE_MODIFIERS,
    data: useMemo<BuilderEntityData>(
      () => ({ drag: { source: 'free-node', sectionId, nodeId, nodeType } }),
      [sectionId, nodeId, nodeType]
    ),
  })
}
