'use client'

import { useBuilderStore } from '@/lib/builder/store'
import { getGridConfig } from '@/lib/builder/grid-config'

/**
 * Renders a 12/8/4-column grid overlay inside a section.
 * Mounted inside each section container when showGridOverlay is true.
 */
export function ColumnOverlay() {
  const activeBreakpoint = useBuilderStore((s) => s.activeBreakpoint)
  const { columns } = getGridConfig(activeBreakpoint)

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[5]"
      aria-hidden
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: 0,
      }}
    >
      {Array.from({ length: columns }).map((_, i) => (
        <div
          key={i}
          className="h-full border-x border-primary/10 bg-primary/[0.03]"
        />
      ))}
    </div>
  )
}
