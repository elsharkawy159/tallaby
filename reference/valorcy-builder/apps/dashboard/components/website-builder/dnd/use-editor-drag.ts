'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { isSortable } from '@dnd-kit/react/sortable'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/react'
import type { Draggable, Droppable } from '@dnd-kit/dom'
import { toast } from 'sonner'
import { sectionRegistry } from '@/components/sections'
import { getPaletteItem } from '@/lib/builder/element-definitions'
import { useBuilderStore } from '@/lib/builder/store'
import { getSectionBinding } from '@/lib/cms/section-bindings'
import { ensureCmsCollectionForSection } from '@/actions/cms/section-binding-actions'
import { reorderWebsitePages } from '@/actions/website-page-actions'
import { prepareSectionInstance } from '@/lib/builder/section-preparation'
import { recordInsertion } from '@/lib/builder/palette-prefs'
import { makeSlotsFor } from '@/lib/builder/slot-snapshot'
import { applyBuilderDropAction, type ApplyDropDeps } from '@/lib/builder/dnd/apply-drop'
import { resolveBuilderDrop } from '@/lib/builder/dnd/resolve-drop'
import { dropEdgeFor } from '@/lib/builder/dnd/edge'
import { emitGuides } from '@/lib/builder/dnd/guides'
import { resolveFreePosition } from '@/lib/builder/dnd/free-position'
import { incomingChildType } from '@/lib/builder/dnd/payload-type'
import { rejectionAtPoint, tickPointerFrame } from '@/lib/builder/dnd/pointer-target'
import {
  asDragPayload,
  asDropTarget,
  isCreationSource,
  type DragOverlayState,
  type DropAxis,
} from '@/lib/builder/dnd/types'
import { targetBox, type EdgeResolver } from '@/components/dnd/dnd-provider'

// ── Target layout (read once per target per drag) ──────────────────────────

interface TargetLayout {
  axis: DropAxis
  dir: 'ltr' | 'rtl'
}

/** Per-drag cache: computed style reads force layout, so each target is read once. */
const layoutCache = new Map<string | number, TargetLayout>()

/** How a target's siblings stack, and the text direction it sits in. */
function layoutOf (target: Droppable): TargetLayout {
  const cached = layoutCache.get(target.id)
  if (cached) return cached
  const element = target.element
  let axis: DropAxis = 'column'
  let dir: 'ltr' | 'rtl' = 'ltr'
  if (element && typeof window !== 'undefined') {
    dir = window.getComputedStyle(element).direction === 'rtl' ? 'rtl' : 'ltr'
    const parent = element.parentElement
    if (parent) {
      const style = window.getComputedStyle(parent)
      if (style.display === 'flex' || style.display === 'inline-flex') {
        axis = style.flexDirection.startsWith('row') ? 'row' : 'column'
      } else if (style.display === 'grid' || style.display === 'inline-grid') {
        axis = style.gridTemplateColumns.trim().split(/\s+/).length > 1 ? 'row' : 'column'
      }
    }
  }
  const layout = { axis, dir }
  layoutCache.set(target.id, layout)
  return layout
}

/**
 * What the hovered target shows: a refusal on the container literally under
 * the pointer when it rejects the element (the drop itself still lands on the
 * nearest valid ancestor), otherwise the rules-aware drop edge.
 */
export const resolveBuilderEdge: EdgeResolver = ({ source, target, point, box }) => {
  const payload = asDragPayload(source.data)
  const drop = asDropTarget(target.data)
  if (!payload || !drop) return null

  tickPointerFrame()
  const rejected = rejectionAtPoint(point.x, point.y, incomingChildType(payload), String(target.id))
  if (rejected) return { id: rejected.dropId, edge: 'reject' }

  const edge = dropEdgeFor(payload, drop, point, box, layoutOf(target).axis)
  return edge ? { id: target.id, edge } : null
}

// ── Overlay ─────────────────────────────────────────────────────────────────

/** Label + preview chip, or a live clone, derived once at drag start. */
function overlayStateFor (source: Draggable): DragOverlayState | null {
  const payload = asDragPayload(source.data)
  switch (payload?.source) {
    case 'palette': {
      const def = sectionRegistry.get(payload.sectionId)
      return { kind: 'chip', label: def?.displayName ?? 'Section', preview: 'section' }
    }
    case 'element-palette': {
      const item = getPaletteItem(payload.paletteId)
      return { kind: 'chip', label: item?.label ?? 'Element', preview: item?.type ?? null }
    }
    case 'media-asset':
      return { kind: 'chip', label: 'Media', preview: 'image' }
    case 'icon-library':
      return { kind: 'chip', label: payload.iconName || 'Icon', preview: 'icon' }
    // Tree nodes (canvas or navigator row) and slot blocks stay put while a
    // clone of them follows the pointer.
    case 'tree-node':
    case 'slot-block':
      return { kind: 'clone' }
    default:
      return null
  }
}

/** Sources that render the overlay; every other source uses its own element feedback. */
export function overlayDisabledFor (source: Draggable | null): boolean {
  return !source || overlayStateFor(source) === null
}

function grabOffsetOf (event: DragStartEvent): { x: number; y: number } | null {
  const activator = event.operation.activatorEvent
  const element = event.operation.source?.element
  if (!(activator instanceof PointerEvent) || !element) return null
  const rect = element.getBoundingClientRect()
  return { x: activator.clientX - rect.left, y: activator.clientY - rect.top }
}

// ── Side effects of a drop ──────────────────────────────────────────────────

/**
 * Post-insert work for a freshly added section: kick off the AI fill state and
 * connect a CMS collection when the section definition declares a binding.
 * Fire-and-forget — a network round-trip must never sit in the drag lifecycle.
 */
function afterSectionInsert (instanceId: string, sectionDefId: string, projectId: string) {
  const store = useBuilderStore.getState()
  if (store.autoFillNewSectionsWithAi) {
    store.setSectionAiLoading(instanceId, 'preparing')
  }

  const binding = getSectionBinding(sectionDefId)
  if (!binding || !projectId) {
    void prepareSectionInstance(instanceId)
    return
  }

  ensureCmsCollectionForSection({
    projectId,
    sectionId: sectionDefId,
    category: binding.category,
  })
    .then((result) => {
      if (!result.ok) return
      const st = useBuilderStore.getState()
      const target =
        st.sections.find((s) => s.id === instanceId) ??
        (st.sharedHeader?.id === instanceId ? st.sharedHeader : null) ??
        (st.sharedFooter?.id === instanceId ? st.sharedFooter : null)
      // The section may have been deleted or replaced while the request was in flight.
      if (!target || target.sectionId !== sectionDefId) return

      const patch: Record<string, unknown> = {
        dataSource: {
          type: 'cms_collection',
          collectionId: result.collectionId,
          collectionSlug: result.collectionSlug,
          category: binding.category,
          itemsPropKey: result.itemsPropKey,
          itemLimit: result.mappedItems.length || 9,
        },
      }
      if (result.mappedItems.length > 0) {
        patch[result.itemsPropKey] = result.mappedItems
      }
      st.updateSectionProps(instanceId, patch)
    })
    .catch(() => {
      /* Section is already on the canvas; binding is best-effort. */
    })
    .finally(() => {
      void prepareSectionInstance(instanceId)
    })
}

/**
 * Commit a free-position (absolute layout) drag. Free drags land *at* a
 * position, not *in* a target, so they bypass drop resolution.
 */
function commitFreePositionDrag (event: DragEndEvent): void {
  const { source, transform } = event.operation
  const payload = asDragPayload(source?.data)
  if (payload?.source !== 'free-node' || !source?.element) return
  const store = useBuilderStore.getState()
  const commit = resolveFreePosition({
    element: source.element,
    transform,
    breakpoint: store.activeBreakpoint,
    sectionId: payload.sectionId,
    nodeId: payload.nodeId,
    layout: 'absolute',
  })
  if (commit) store.commitNodePosition(commit.sectionId, commit.nodeId, commit.patch)
}

/**
 * The builder's drag lifecycle glue: overlay state at start, one resolved
 * action at the end. Holds no drop rules itself — those live in
 * `lib/builder/dnd`.
 */
export function useEditorDrag ({
  projectId,
  websiteId,
}: {
  projectId: string
  websiteId: string
}) {
  const [overlay, setOverlay] = useState<DragOverlayState | null>(null)
  const [grabOffset, setGrabOffset] = useState<{ x: number; y: number } | null>(null)
  // Read inside handlers only — never triggers a re-render mid-drag.
  const isCreationDrag = useRef(false)

  const deps = useMemo<ApplyDropDeps>(
    () => ({
      afterSectionInsert: (instanceId, sectionDefId) =>
        afterSectionInsert(instanceId, sectionDefId, projectId),
      persistPageOrder: (ordered) => {
        void reorderWebsitePages(projectId, websiteId, ordered).catch(() => {
          toast.error('Could not save the new page order.')
        })
      },
      recordInsertion,
    }),
    [projectId, websiteId]
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    layoutCache.clear()
    const source = event.operation.source
    if (!source) return
    isCreationDrag.current = isCreationSource(asDragPayload(source.data)?.source)
    setOverlay(overlayStateFor(source))
    setGrabOffset(grabOffsetOf(event))
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      try {
        if (event.canceled) return
        const { source, target } = event.operation
        const payload = asDragPayload(source?.data)
        if (payload?.source === 'free-node') {
          commitFreePositionDrag(event)
          return
        }

        const drop = asDropTarget(target?.data)
        const layout = target ? layoutOf(target) : undefined
        const point = event.operation.position.current
        const box = target ? targetBox(target) : null
        const edge =
          payload && drop && box && layout
            ? dropEdgeFor(payload, drop, point, box, layout.axis)
            : null

        const state = useBuilderStore.getState()
        const action = resolveBuilderDrop(
          {
            source: payload,
            target: drop,
            edge,
            sortable: isSortable(source)
              ? {
                  initialIndex: source.initialIndex,
                  index: source.index,
                  initialGroup: source.initialGroup,
                  group: source.group,
                }
              : null,
            axis: layout?.axis,
            dir: layout?.dir,
            transform: event.operation.transform,
          },
          {
            sections: state.sections,
            pages: state.pages,
            injectedChildren: state.injectedChildren,
            slotsFor: makeSlotsFor(state),
          }
        )

        // A creation drag that resolved to nothing is almost always "there is no
        // section to drop into yet" — tell the user rather than failing silently.
        if (!action && isCreationDrag.current && target && payload?.source !== 'palette') {
          toast.message('Drop this onto a section on the canvas.')
        }

        applyBuilderDropAction(action, state, deps)
      } finally {
        isCreationDrag.current = false
        layoutCache.clear()
        emitGuides([])
        setOverlay(null)
        setGrabOffset(null)
      }
    },
    [deps]
  )

  return { overlay, grabOffset, handleDragStart, handleDragEnd }
}
