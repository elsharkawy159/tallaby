'use client'

import type { ReactNode } from 'react'

/**
 * A small label that follows the pointer while dragging something that has no
 * natural preview (a palette entry, an asset, an icon).
 *
 * The drag overlay is sized to the source element and anchored at the point it
 * was grabbed, so a chip smaller than its source is placed at that grab offset
 * — otherwise it would trail the cursor by up to the source's full size.
 */
export function DndOverlayChip ({
  grabOffset,
  icon,
  label,
}: {
  /** Pointer position inside the source element when the drag started. */
  grabOffset: { x: number; y: number } | null
  icon?: ReactNode
  label: string
}) {
  return (
    <div
      className="pointer-events-none absolute flex max-w-xs items-center gap-2 whitespace-nowrap rounded-lg border border-primary/30 bg-card px-3 py-2 text-sm font-medium text-foreground opacity-95 shadow-2xl ring-2 ring-primary/20"
      style={{ left: (grabOffset?.x ?? 0) + 8, top: (grabOffset?.y ?? 0) + 8 }}
    >
      {icon}
      <span className="truncate">{label}</span>
    </div>
  )
}
