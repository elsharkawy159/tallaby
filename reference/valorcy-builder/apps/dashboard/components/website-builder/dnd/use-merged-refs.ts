'use client'

import { useCallback, useRef } from 'react'

type RefCallback = (element: HTMLElement | null) => void

/**
 * Merge several dnd-kit ref callbacks onto one element with a permanently
 * stable identity.
 *
 * A tree node registers up to three entities (sortable, container droppable,
 * free-position draggable) on the same DOM node. Building the merged callback
 * inline would give it a new identity every render, which makes React detach
 * and re-attach the element — and dnd-kit unregisters/re-registers the entity
 * each time, thrashing the collision index mid-drag.
 */
export function useMergedRefs (...refs: Array<RefCallback | undefined>): RefCallback {
  const latest = useRef(refs)
  latest.current = refs

  return useCallback((element: HTMLElement | null) => {
    for (const ref of latest.current) ref?.(element)
  }, [])
}
