/**
 * A tiny external store for "which target is hovered, and where".
 *
 * The provider writes to it on every drag move; components read their own
 * entry with `useSyncExternalStore`. Listeners are keyed by target id, so a
 * change only notifies the target that lost the hover and the one that gained
 * it — never the rest of the tree.
 */

export type DndEdge = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'reject'

export interface DndEdgeState {
  id: string | number
  edge: DndEdge
}

type Listener = () => void

export interface EdgeStore {
  /** The edge for one target, or `null` when it isn't hovered. */
  get: (id: string | number) => DndEdge | null
  /** The whole state (for global consumers like a cursor class). */
  current: () => DndEdgeState | null
  set: (next: DndEdgeState | null) => void
  subscribe: (id: string | number, fn: Listener) => () => void
  subscribeAll: (fn: Listener) => () => void
}

export function createEdgeStore (): EdgeStore {
  let state: DndEdgeState | null = null
  const byId = new Map<string, Set<Listener>>()
  const all = new Set<Listener>()

  const notify = (id: string | number | undefined) => {
    if (id === undefined) return
    const set = byId.get(String(id))
    if (set) for (const fn of set) fn()
  }

  return {
    get: (id) => (state && String(state.id) === String(id) ? state.edge : null),
    current: () => state,
    set: (next) => {
      if (state === next) return
      if (state && next && state.id === next.id && state.edge === next.edge) return
      const prev = state
      state = next
      notify(prev?.id)
      if (!prev || !next || String(prev.id) !== String(next.id)) notify(next?.id)
      for (const fn of all) fn()
    },
    subscribe: (id, fn) => {
      const key = String(id)
      let set = byId.get(key)
      if (!set) {
        set = new Set()
        byId.set(key, set)
      }
      set.add(fn)
      return () => {
        set.delete(fn)
        if (set.size === 0) byId.delete(key)
      }
    },
    subscribeAll: (fn) => {
      all.add(fn)
      return () => {
        all.delete(fn)
      }
    },
  }
}
