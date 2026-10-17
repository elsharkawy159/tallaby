'use client'

import { useLayoutEffect, useRef } from 'react'
import { ElementPreview } from '@/components/website-builder/panels/element-preview'
import { DndOverlayChip } from '@/components/dnd/dnd-overlay-chip'
import { SITE_THEME_ROOT_CLASS } from '@/lib/builder/design-system-css-vars'
import type { DragOverlayState } from '@/lib/builder/dnd/types'

/** Attributes that make an element addressable by the editor — never on a preview. */
const IDENTITY_ATTRS = [
  'data-element-id',
  'data-element-container',
  'data-drop-id',
  'data-drag-source',
  'data-drop-target',
  'id',
]

/**
 * A live copy of the dragged canvas element. `cloneNode` rather than an HTML
 * round-trip: cheap, and it keeps the element's inline styles exactly. Identity
 * attributes are stripped so selection/hover CSS, the instrumenter and
 * `[data-element-id]` lookups never mistake the preview for the real node.
 * The host carries the site-theme class so the copy keeps the site's tokens.
 */
function ClonePreview ({ element }: { element: Element }) {
  const hostRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    const clone = element.cloneNode(true) as HTMLElement
    for (const el of [clone, ...Array.from(clone.querySelectorAll('*'))]) {
      for (const attr of IDENTITY_ATTRS) el.removeAttribute(attr)
      el.removeAttribute('data-drop-indicator')
    }
    // The drop indicator and drag handle are editor chrome, not content.
    clone.querySelectorAll('[data-drop-indicator], [data-drag-handle]').forEach((el) => el.remove())
    host.replaceChildren(clone)
    return () => host.replaceChildren()
  }, [element])
  return (
    <div
      ref={hostRef}
      aria-hidden
      className={`${SITE_THEME_ROOT_CLASS} pointer-events-none size-full overflow-hidden rounded-sm opacity-90 shadow-2xl ring-2 ring-[var(--builder-primary)]`}
    />
  )
}

/**
 * The builder's single overlay. Creation drags (palette, assets, icons) get a
 * chip that sits under the cursor; canvas nodes and slot blocks get a clone of
 * themselves. Sections and panel rows use element feedback and never reach here.
 */
export function BuilderDragOverlayContent ({
  state,
  grabOffset,
  element,
}: {
  state: DragOverlayState | null
  grabOffset: { x: number; y: number } | null
  element: Element | undefined
}) {
  if (!state) return null
  if (state.kind === 'clone') {
    return element ? <ClonePreview element={element} /> : null
  }
  return (
    <DndOverlayChip
      grabOffset={grabOffset}
      label={state.label}
      icon={state.preview ? <ElementPreview type={state.preview} /> : null}
    />
  )
}
