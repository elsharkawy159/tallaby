'use client'

import { useCallback, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { cn } from '@workspace/ui/lib/utils'

import { SectionLink } from '@/components/website-builder/section-link'
import { InlineEditableText } from '@/components/website-builder/inline-editable'
import { LucideIcon } from '@/components/website-builder/icons/lucide-icon'
import type { NavigationSettings, NavItem } from '@/lib/builder/shared-chrome/types'
import { withNewTab } from './link-utils'
import { iconKey } from './social-options'

/**
 * Desktop navigation with unlimited nesting.
 *
 * Top level renders inline; every level below renders as a dropdown that opens
 * on hover (with a close delay, so diagonal mouse paths don't drop the menu) or
 * on click, per the navigation component's settings. Submenus beyond the second
 * level flow out to the side, the way Framer and Webflow do it.
 */

const ANIMATION_CLASS: Record<string, string> = {
  fade: 'animate-in fade-in-0 duration-150',
  slide: 'animate-in fade-in-0 slide-in-from-top-1 duration-150',
  scale: 'animate-in fade-in-0 zoom-in-95 duration-150',
  none: '',
}

export interface NavRenderContext {
  instanceId: string
  isPreview: boolean
  linkClass: string
  settings: NavigationSettings
  /** Inline-edit a nav item's label (canvas only). */
  onLabelChange?: (itemId: string, label: string) => void
}

function badgeClass (variant: string | undefined): string {
  switch (variant) {
    case 'success':
      return 'bg-emerald-500/15 text-emerald-600'
    case 'warning':
      return 'bg-amber-500/15 text-amber-600'
    case 'destructive':
      return 'bg-destructive/15 text-destructive'
    case 'secondary':
      return 'bg-secondary/15 text-secondary-foreground'
    case 'default':
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-primary/10 text-primary'
  }
}

function NavLabel ({ item, ctx }: { item: NavItem; ctx: NavRenderContext }) {
  return (
    <>
      {item.icon ? <LucideIcon name={iconKey(item.icon)} size={14} className="shrink-0" /> : null}
      {ctx.onLabelChange && !ctx.isPreview ? (
        <InlineEditableText
          as="span"
          value={item.label}
          isPreview={ctx.isPreview}
          onChange={(t) => ctx.onLabelChange?.(item.id, t)}
          onCommit={(t) => ctx.onLabelChange?.(item.id, t)}
        />
      ) : (
        <span>{item.label}</span>
      )}
      {item.badge?.text ? (
        <span
          className={cn(
            'ms-1 rounded-full px-1.5 py-px text-[10px] font-semibold',
            badgeClass(item.badge.variant)
          )}
        >
          {item.badge.text}
        </span>
      ) : null}
    </>
  )
}

function NavLeaf ({
  item,
  ctx,
  index,
  className,
}: {
  item: NavItem
  ctx: NavRenderContext
  index: number
  className: string
}) {
  return (
    <SectionLink
      link={withNewTab(item.link, item.newTab)}
      isPreview={ctx.isPreview}
      data-element-id={`${ctx.instanceId}::navLink${index}`}
      data-element-type="textLink"
      data-element-collection="links"
      data-element-index={String(index)}
      data-element-item-href-prop="href"
      data-nav-active={item.activeState === 'always' ? 'true' : undefined}
      className={cn(
        className,
        item.activeState === 'always' && 'text-foreground'
      )}
    >
      <NavLabel item={item} ctx={ctx} />
    </SectionLink>
  )
}

/** One branch: a trigger plus its submenu, recursing for deeper levels. */
function NavBranch ({
  item,
  ctx,
  depth,
}: {
  item: NavItem
  ctx: NavRenderContext
  depth: number
}) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const byHover = ctx.settings.trigger !== 'click'

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }, [])

  const scheduleClose = useCallback(() => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), ctx.settings.hoverDelay ?? 120)
  }, [cancelClose, ctx.settings.hoverDelay])

  const children = (item.children ?? []).filter((c) => !c.hidden)
  const animation = ANIMATION_CLASS[ctx.settings.dropdownAnimation] ?? ANIMATION_CLASS.fade

  return (
    <div
      className="relative"
      onMouseEnter={byHover ? () => { cancelClose(); setOpen(true) } : undefined}
      onMouseLeave={byHover ? scheduleClose : undefined}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(ctx.linkClass, 'inline-flex items-center gap-1')}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <NavLabel item={item} ctx={ctx} />
        <ChevronDown
          size={13}
          aria-hidden
          className={cn(
            'text-muted-foreground/70 transition-transform duration-150',
            open && 'rotate-180',
            depth > 0 && '-rotate-90'
          )}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute z-50 min-w-[190px] rounded-lg border border-border bg-background p-1.5 shadow-lg',
            // Level 1 hangs below the bar; deeper levels fly out sideways.
            depth === 0 ? 'start-0 top-full mt-1.5' : 'start-full top-0 ms-1',
            animation
          )}
        >
          {children.map((child, childIndex) => (
            <NavNode
              key={child.id}
              item={child}
              ctx={ctx}
              index={childIndex}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function NavNode ({
  item,
  ctx,
  index,
  depth,
}: {
  item: NavItem
  ctx: NavRenderContext
  index: number
  depth: number
}) {
  const children = (item.children ?? []).filter((c) => !c.hidden)
  const itemClass =
    depth === 0
      ? ctx.linkClass
      : 'flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'

  return (
    <>
      {item.dividerBefore ? (
        <span aria-hidden className={depth === 0 ? 'mx-1 h-4 w-px bg-border' : 'my-1 block h-px bg-border'} />
      ) : null}
      {children.length > 0 ? (
        <NavBranch item={item} ctx={ctx} depth={depth} />
      ) : (
        <NavLeaf item={item} ctx={ctx} index={index} className={itemClass} />
      )}
      {item.dividerAfter ? (
        <span aria-hidden className={depth === 0 ? 'mx-1 h-4 w-px bg-border' : 'my-1 block h-px bg-border'} />
      ) : null}
    </>
  )
}

export function NavDesktop ({
  items,
  ctx,
  className,
}: {
  items: NavItem[]
  ctx: NavRenderContext
  className?: string
}) {
  const visible = items.filter((item) => !item.hidden)
  if (visible.length === 0) return null

  return (
    <nav className={className} style={{ gap: ctx.settings.gap }}>
      {visible.map((item, index) => (
        <NavNode key={item.id} item={item} ctx={ctx} index={index} depth={0} />
      ))}
    </nav>
  )
}
