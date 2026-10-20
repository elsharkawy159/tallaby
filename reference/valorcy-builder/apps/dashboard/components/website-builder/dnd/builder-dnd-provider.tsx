'use client'

import { useEffect, type ReactNode } from 'react'
import { DndProvider, useDropEdgeSelector } from '@/components/dnd/dnd-provider'
import {
  BUILDER_MODIFIERS,
  BUILDER_PLUGINS,
  BUILDER_SENSORS,
} from '@/lib/builder/dnd/registry'
import { BuilderDragOverlayContent } from './builder-drag-overlay'
import { overlayDisabledFor, resolveBuilderEdge, useEditorDrag } from './use-editor-drag'

/** Toggled while the pointer is over a container that refuses the drag. */
const INVALID_DROP_CLASS = 'builder-drop-invalid'

/**
 * A `not-allowed` cursor while a refusal is shown. A body class rather than
 * React state in the canvas, so it never re-renders the tree.
 */
function InvalidDropCursor () {
  const invalid = useDropEdgeSelector((state) => state?.edge === 'reject')
  useEffect(() => {
    document.body.classList.toggle(INVALID_DROP_CLASS, invalid)
    return () => document.body.classList.remove(INVALID_DROP_CLASS)
  }, [invalid])
  return null
}

/**
 * The builder's single drag-and-drop surface.
 *
 * Everything draggable in the editor — palettes, canvas sections, component
 * tree nodes, slots, the pages list, the navigator, chrome panels — lives under
 * this one provider, so there is exactly one drag lifecycle, one overlay, and
 * one place that commits a drop.
 */
export function BuilderDndProvider ({
  projectId,
  websiteId,
  children,
}: {
  projectId: string
  websiteId: string
  children: ReactNode
}) {
  const { overlay, grabOffset, handleDragStart, handleDragEnd } = useEditorDrag({
    projectId,
    websiteId,
  })

  return (
    <DndProvider
      sensors={BUILDER_SENSORS}
      plugins={BUILDER_PLUGINS}
      modifiers={BUILDER_MODIFIERS}
      resolveEdge={resolveBuilderEdge}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      overlayDisabled={overlayDisabledFor}
      overlayClassName="!cursor-grabbing"
      overlay={(source) => (
        <BuilderDragOverlayContent
          state={overlay}
          grabOffset={grabOffset}
          element={source.element}
        />
      )}
    >
      {children}
      <InvalidDropCursor />
    </DndProvider>
  )
}
