'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@workspace/ui/lib/utils'
import type { InsertTarget } from '@/lib/builder/insertion-engine'
import { QuickInsertPalette } from './quick-insert-palette'

/**
 * The "+" affordance on an empty container.
 *
 * Dropping into a small empty column is the fiddliest drag in the editor, and
 * before this it was the *only* way to fill one. The button opens the same
 * Quick Insert palette as ⌘K, pre-targeted at this container, so filling a
 * nested slot is two clicks and no aiming.
 */
export function QuickAddButton ({
  target,
  className,
  label = 'Add an element here',
}: {
  target: InsertTarget
  className?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        aria-label={label}
        title={label}
        onClick={(e) => {
          // The container underneath is a drop target and a selection surface;
          // neither should react to a click on this button.
          e.stopPropagation()
          e.preventDefault()
          setOpen(true)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className={cn(
          'flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors',
          'hover:border-primary/50 hover:bg-primary/10 hover:text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className
        )}
      >
        <Plus className="size-3" strokeWidth={2} />
      </button>
      <QuickInsertPalette open={open} onOpenChange={setOpen} request={{ target }} />
    </>
  )
}
