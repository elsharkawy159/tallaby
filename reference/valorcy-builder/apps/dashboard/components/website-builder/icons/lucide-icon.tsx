'use client'

import { memo } from 'react'
import { DynamicIcon } from 'lucide-react/dynamic'
import { resolveIconName } from '@/lib/builder/icon-library'
import { cn } from '@workspace/ui/lib/utils'

export interface LucideIconProps {
  /** Kebab-case Lucide icon name (e.g. "arrow-right"). Invalid names fall back. */
  name: string
  size?: number | string
  color?: string
  strokeWidth?: number
  className?: string
  /** Inline style passthrough (used for rotation/opacity on the canvas). */
  style?: React.CSSProperties
  'aria-label'?: string
}

/**
 * Reusable dynamic Lucide icon renderer.
 *
 * - Renders by name via `lucide-react/dynamic`'s `DynamicIcon`, which lazy-loads
 *   only the icons actually used — the full lucide bundle never ships eagerly.
 * - Unknown/missing names resolve to a safe fallback icon (never crashes).
 * - Memoized so grids of many icons don't re-render needlessly.
 */
function LucideIconImpl ({
  name,
  size = 24,
  color,
  strokeWidth = 2,
  className,
  style,
  ...rest
}: LucideIconProps) {
  const resolved = resolveIconName(name)
  // Reserve the icon's footprint while the chunk loads (and during SSR) to avoid
  // layout shift — DynamicIcon renders `null` until the icon node resolves.
  const Fallback = () => (
    <span
      aria-hidden
      style={{ display: 'inline-block', width: size, height: size }}
    />
  )
  return (
    <DynamicIcon
      name={resolved as Parameters<typeof DynamicIcon>[0]['name']}
      fallback={Fallback}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={cn(className)}
      style={style}
      aria-hidden={rest['aria-label'] ? undefined : true}
      aria-label={rest['aria-label']}
    />
  )
}

export const LucideIcon = memo(LucideIconImpl)
