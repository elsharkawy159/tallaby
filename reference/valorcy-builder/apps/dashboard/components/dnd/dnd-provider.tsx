'use client'

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
} from 'react'
import {
  DragDropProvider,
  DragOverlay,
  type DragDropManager,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/react'
import type { Draggable, DropAnimation, Droppable } from '@dnd-kit/dom'
import { createEdgeStore, type DndEdge, type DndEdgeState, type EdgeStore } from './edge-store'
import { DND_MODIFIERS, DND_SENSORS } from './presets'

type ProviderProps = ComponentProps<typeof DragDropProvider>

export interface EdgeContext {
  source: Draggable
  target: Droppable
  /** Up-to-date pointer (or keyboard-cursor) position, in viewport coordinates. */
  point: { x: number; y: number }
  /** The target's current box, in viewport coordinates. */
  box: { left: number; top: number; width: number; height: number }
}

/** Decides what the hovered target should indicate. Pure presentation — no commits. */
export type EdgeResolver = (ctx: EdgeContext) => DndEdgeState | null

const EdgeStoreContext = createContext<EdgeStore | null>(null)

/** The drop edge currently shown on target `id`, or `null`. Re-renders only when it changes. */
export function useDropEdge (id: string | number): DndEdge | null {
  const store = useContext(EdgeStoreContext)
  return useSyncExternalStore(
    useCallback((fn: () => void) => (store ? store.subscribe(id, fn) : () => {}), [store, id]),
    () => store?.get(id) ?? null,
    () => null
  )
}

/**
 * A value derived from the whole edge state, for global consumers (e.g. a "not
 * allowed" cursor). Return a primitive: the component re-renders only when the
 * selected value changes, not on every hover change.
 */
export function useDropEdgeSelector<T extends string | number | boolean | null> (
  select: (state: DndEdgeState | null) => T
): T {
  const store = useContext(EdgeStoreContext)
  const selectRef = useRef(select)
  useLayoutEffect(() => {
    selectRef.current = select
  })
  return useSyncExternalStore(
    useCallback((fn: () => void) => (store ? store.subscribeAll(fn) : () => {}), [store]),
    () => selectRef.current(store?.current() ?? null),
    () => selectRef.current(null)
  )
}

/** A droppable's current box in viewport coordinates, or `null` when it has no size. */
export function targetBox (target: Droppable): EdgeContext['box'] | null {
  const rect = target.shape?.boundingRectangle ?? target.element?.getBoundingClientRect()
  if (!rect || (rect.width === 0 && rect.height === 0)) return null
  return { left: rect.left, top: rect.top, width: rect.width, height: rect.height }
}

/**
 * One drag-and-drop surface: sensors, the single `DragOverlay`, and central
 * drop-edge tracking. Holds no business logic — callers commit in `onDragEnd`.
 *
 * Edge tracking runs here rather than in components because the pointer sensor
 * captures the pointer on `document.body` and stops `pointermove` propagation
 * for the length of a drag: per-element pointer listeners go quiet mid-drag.
 */
export function DndProvider ({
  children,
  sensors = DND_SENSORS,
  plugins,
  modifiers = DND_MODIFIERS,
  overlay,
  overlayDisabled,
  overlayClassName,
  dropAnimation,
  resolveEdge,
  onDragStart,
  onDragMove,
  onDragOver,
  onDragEnd,
}: {
  children: ReactNode
  sensors?: ProviderProps['sensors']
  plugins?: ProviderProps['plugins']
  modifiers?: ProviderProps['modifiers']
  /** Content of the single drag overlay. Omit to use each source's own feedback. */
  overlay?: ReactNode | ((source: Draggable) => ReactNode)
  /** Disable the overlay (fall back to element feedback) for some or all sources. */
  overlayDisabled?: boolean | ((source: Draggable | null) => boolean)
  overlayClassName?: string
  dropAnimation?: DropAnimation | null
  resolveEdge?: EdgeResolver
  onDragStart?: (event: DragStartEvent, manager: DragDropManager) => void
  onDragMove?: (event: DragMoveEvent, manager: DragDropManager) => void
  onDragOver?: (event: DragOverEvent, manager: DragDropManager) => void
  onDragEnd?: (event: DragEndEvent, manager: DragDropManager) => void
}) {
  const store = useMemo(() => createEdgeStore(), [])
  // Handlers read the latest props through a ref, so the provider's own
  // callbacks keep a stable identity for the lifetime of the surface.
  const latest = useRef({ resolveEdge, onDragStart, onDragMove, onDragOver, onDragEnd })
  useLayoutEffect(() => {
    latest.current = { resolveEdge, onDragStart, onDragMove, onDragOver, onDragEnd }
  })

  const track = useCallback(
    (
      operation: DragMoveEvent['operation'],
      point: { x: number; y: number } | undefined
    ) => {
      const resolver = latest.current.resolveEdge
      if (!resolver) return
      const { source, target } = operation
      const box = target ? targetBox(target) : null
      if (!source || !target || !point || !box) {
        store.set(null)
        return
      }
      store.set(resolver({ source, target, point, box }))
    },
    [store]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent, manager: DragDropManager) => {
      store.set(null)
      latest.current.onDragStart?.(event, manager)
    },
    [store]
  )

  const handleDragMove = useCallback(
    (event: DragMoveEvent, manager: DragDropManager) => {
      // `dragmove` fires *before* the position updates: `position.current` is
      // one step stale. The pointer sensor reports the new point as `to`; the
      // keyboard sensor reports a delta as `by`.
      const current = event.operation.position.current
      const point =
        event.to ??
        (event.by && current ? { x: current.x + event.by.x, y: current.y + event.by.y } : current)
      track(event.operation, point)
      latest.current.onDragMove?.(event, manager)
    },
    [track]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent, manager: DragDropManager) => {
      // By `dragover` the position is up to date.
      track(event.operation, event.operation.position.current)
      latest.current.onDragOver?.(event, manager)
    },
    [track]
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent, manager: DragDropManager) => {
      store.set(null)
      latest.current.onDragEnd?.(event, manager)
    },
    [store]
  )

  return (
    <EdgeStoreContext.Provider value={store}>
      <DragDropProvider
        sensors={sensors}
        plugins={plugins}
        modifiers={modifiers}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
        {overlay !== undefined ? (
          <DragOverlay
            className={overlayClassName}
            disabled={overlayDisabled}
            dropAnimation={dropAnimation}
          >
            {overlay}
          </DragOverlay>
        ) : null}
      </DragDropProvider>
    </EdgeStoreContext.Provider>
  )
}
