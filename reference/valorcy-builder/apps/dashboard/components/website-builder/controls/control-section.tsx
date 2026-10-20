'use client'

import type { ReactNode } from 'react'
import { cn } from '@workspace/ui/lib/utils'

/**
 * Optional label + description for grouped design controls (e.g. inside an Accordion item).
 */
export function ControlSection ({
  title,
  description,
  children,
  className
}: {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {title && <p className="text-xs font-medium text-foreground">{title}</p>}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  )
}
