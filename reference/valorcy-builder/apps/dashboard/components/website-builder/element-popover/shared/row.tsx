'use client'

import type { ReactNode } from 'react'

export function Row ({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="w-14 shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
        {children}
      </div>
    </div>
  )
}
