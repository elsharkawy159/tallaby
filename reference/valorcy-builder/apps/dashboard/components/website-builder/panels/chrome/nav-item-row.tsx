'use client'

import { memo, useCallback } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  Link2,
  Trash2,
} from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import { LucideIcon } from '@/components/website-builder/icons/lucide-icon'
import { useSortableNavItem } from '@/components/website-builder/dnd/use-panel-sortables'
import { NAV_INDENT_WIDTH } from '@/lib/builder/shared-chrome/constants'
import type { ChromeRole, NavItem } from '@/lib/builder/shared-chrome/types'

export interface NavRowActions {
  onToggleCollapse: (id: string) => void
  onToggleHidden: (id: string) => void
  onDuplicate: (id: string) => void
  onRemove: (id: string) => void
  onSelect: (id: string) => void
}

/**
 * One row of the navigation tree.
 *
 * Memoised on the fields it actually renders: a drag over a 100-item tree
 * re-renders the list container constantly, and without this every row would
 * re-render with it.
 */
function NavItemRowImpl ({
  item,
  role,
  depth,
  index,
  childCount,
  selected,
  actions,
}: {
  item: NavItem
  role: ChromeRole
  depth: number
  index: number
  childCount: number
  selected: boolean
  actions: NavRowActions
}) {
  const { ref, handleRef, isDragging } = useSortableNavItem({ role, navId: item.id, index })

  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), [])
  const hasChildren = childCount > 0

  return (
    <div
      ref={ref}
      style={{ marginInlineStart: depth * NAV_INDENT_WIDTH }}
      className={cn(
        'group/nav relative flex items-center gap-1 rounded-md border border-transparent bg-background py-1 pe-1 ps-0.5',
        'hover:border-border hover:bg-muted/50',
        selected && 'border-primary/40 bg-primary/5',
        isDragging && 'opacity-50',
        item.hidden && 'opacity-60'
      )}
      data-nav-depth={depth}
    >
      {/* Indentation guide — makes the hierarchy readable at a glance. */}
      {depth > 0 ? (
        <span
          aria-hidden
          className="absolute inset-y-0 -start-2 w-px bg-border"
        />
      ) : null}

      <button
        type="button"
        ref={handleRef}
        aria-label={`Reorder ${item.label}`}
        aria-roledescription="draggable navigation item"
        className="flex size-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 active:cursor-grabbing group-hover/nav:opacity-100"
        onClick={stop}
      >
        <GripVertical className="size-3.5" />
      </button>

      {hasChildren ? (
        <button
          type="button"
          aria-label={item.collapsed ? `Expand ${item.label}` : `Collapse ${item.label}`}
          aria-expanded={!item.collapsed}
          className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation()
            actions.onToggleCollapse(item.id)
          }}
        >
          {item.collapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
      ) : (
        <span className="size-4 shrink-0" aria-hidden />
      )}

      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-start"
        onClick={() => actions.onSelect(item.id)}
      >
        {item.icon ? (
          <LucideIcon name={item.icon} size={13} className="shrink-0 text-muted-foreground" />
        ) : null}
        <span className="truncate text-xs font-medium">{item.label || 'Untitled'}</span>
        {item.badge?.text ? (
          <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-px text-[9px] font-semibold text-primary">
            {item.badge.text}
          </span>
        ) : null}
        {hasChildren ? (
          <span className="shrink-0 text-[10px] text-muted-foreground">{childCount}</span>
        ) : null}
      </button>

      <div className="flex shrink-0 items-center opacity-0 transition-opacity focus-within:opacity-100 group-hover/nav:opacity-100">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-6"
          aria-label={item.hidden ? `Show ${item.label}` : `Hide ${item.label}`}
          onClick={(e) => {
            e.stopPropagation()
            actions.onToggleHidden(item.id)
          }}
        >
          {item.hidden ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-6"
          aria-label={`Duplicate ${item.label}`}
          onClick={(e) => {
            e.stopPropagation()
            actions.onDuplicate(item.id)
          }}
        >
          <Copy className="size-3" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-6 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${item.label}`}
          onClick={(e) => {
            e.stopPropagation()
            actions.onRemove(item.id)
          }}
        >
          <Trash2 className="size-3" />
        </Button>
      </div>

      {item.auto ? (
        <span
          title="Follows a site page — edits make it manual"
          className="shrink-0 text-muted-foreground/60"
        >
          <Link2 className="size-3" />
        </span>
      ) : null}
    </div>
  )
}

export const NavItemRow = memo(NavItemRowImpl)
