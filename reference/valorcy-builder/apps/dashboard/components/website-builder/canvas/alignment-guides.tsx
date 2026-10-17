'use client'

import { useEffect, useRef, useState } from 'react'
import { subscribeToGuides, getGuides } from '@/lib/builder/dnd/guides'
import type { GuideLine } from '@/lib/builder/snap-engine'

const GUIDE_COLOR = 'rgba(20,110,245,0.7)'

export function AlignmentGuides() {
  const [guides, setGuides] = useState<GuideLine[]>(() => getGuides())
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    return subscribeToGuides((next) => {
      if (frameRef.current !== null) return
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = null
        setGuides([...next])
      })
    })
  }, [])

  if (guides.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[300]" aria-hidden>
      {guides.map((g, i) => {
        if (g.axis === 'x') {
          return (
            <div
              key={i}
              className="absolute top-0 w-px"
              style={{ left: g.position, height: g.span, backgroundColor: GUIDE_COLOR }}
            />
          )
        }
        return (
          <div
            key={i}
            className="absolute start-0 h-px"
            style={{ top: g.position, width: g.span, backgroundColor: GUIDE_COLOR }}
          />
        )
      })}
    </div>
  )
}
