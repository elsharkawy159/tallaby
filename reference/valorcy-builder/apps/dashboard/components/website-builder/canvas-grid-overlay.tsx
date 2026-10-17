'use client'

import { useBuilderStore } from '@/lib/builder/store'

/**
 * 12-column grid overlay rendered above the canvas content.
 * Toggled by showGridOverlay in the builder store.
 * Uses pointer-events:none so it never blocks canvas interactions.
 */
export function CanvasGridOverlay () {
  const showGridOverlay = useBuilderStore((s) => s.showGridOverlay)
  if (!showGridOverlay) return null

  return (
    <div
      aria-hidden
      data-no-instrument
      className="pointer-events-none absolute inset-0 z-[100]"
      style={{ padding: '0 16px' }}
    >
      <div
        className="mx-auto h-full w-full"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '8px',
          maxWidth: '1200px',
        }}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="h-full"
            style={{
              backgroundColor: 'color-mix(in srgb, #4F28BA 7%, transparent)',
              borderLeft: '1px solid color-mix(in srgb, #4F28BA 18%, transparent)',
              borderRight: '1px solid color-mix(in srgb, #4F28BA 18%, transparent)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
