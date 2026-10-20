'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'

import { cn } from '@workspace/ui/lib/utils'

import { SectionLink } from '@/components/website-builder/section-link'
import { LucideIcon } from '@/components/website-builder/icons/lucide-icon'
import type { ChromeMobileSettings, NavItem } from '@/lib/builder/shared-chrome/types'
import { withNewTab } from './link-utils'
import { iconKey } from './social-options'

/**
 * Mobile navigation — drawer, fullscreen or overlay panel.
 *
 * The trigger and panel are rendered inside the chrome so the whole thing stays
 * one section: no portals, which keeps it working identically on the canvas
 * (where the page is inside a scaled preview frame) and on the live site.
 */

function panelPosition (mobile: ChromeMobileSettings): string {
  if (mobile.mode === 'fullscreen') return 'inset-0'
  if (mobile.mode === 'overlay') return 'inset-x-3 top-3 rounded-xl'
  switch (mobile.direction) {
    case 'left':
      return 'inset-y-0 start-0 w-[82%] max-w-sm'
    case 'top':
      return 'inset-x-0 top-0 max-h-[85dvh]'
    case 'bottom':
      return 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl'
    default:
      return 'inset-y-0 end-0 w-[82%] max-w-sm'
  }
}

function panelAnimation (mobile: ChromeMobileSettings): string {
  if (mobile.animation === 'fade') return 'animate-in fade-in-0 duration-200'
  if (mobile.animation === 'scale') return 'animate-in fade-in-0 zoom-in-95 duration-200'
  const from =
    mobile.mode === 'fullscreen' || mobile.mode === 'overlay'
      ? 'slide-in-from-top-2'
      : mobile.direction === 'left'
        ? 'slide-in-from-left'
        : mobile.direction === 'top'
          ? 'slide-in-from-top'
          : mobile.direction === 'bottom'
            ? 'slide-in-from-bottom'
            : 'slide-in-from-right'
  return `animate-in fade-in-0 ${from} duration-200`
}

function MobileNavItem ({
  item,
  depth,
  mobile,
  isPreview,
  onNavigate,
}: {
  item: NavItem
  depth: number
  mobile: ChromeMobileSettings
  isPreview: boolean
  onNavigate: () => void
}) {
  const children = (item.children ?? []).filter((c) => !c.hidden)
  const [open, setOpen] = useState(false)
  const accordion = mobile.nestedAccordion && children.length > 0

  if (accordion) {
    return (
      <div className="flex flex-col">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-between gap-2 rounded-md px-3 py-3 text-[15px] font-medium text-foreground hover:bg-muted"
          style={{ paddingInlineStart: 12 + depth * 12 }}
        >
          <span className="flex items-center gap-2">
            {item.icon ? <LucideIcon name={iconKey(item.icon)} size={15} /> : null}
            {item.label}
          </span>
          <ChevronDown
            size={15}
            aria-hidden
            className={cn('text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </button>
        {open ? (
          <div className="flex flex-col">
            {children.map((child) => (
              <MobileNavItem
                key={child.id}
                item={child}
                depth={depth + 1}
                mobile={mobile}
                isPreview={isPreview}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <SectionLink
        link={withNewTab(item.link, item.newTab)}
        isPreview={isPreview}
        onClick={() => {
          if (mobile.closeOnClick) onNavigate()
        }}
        className="flex items-center gap-2 rounded-md px-3 py-3 text-[15px] font-medium text-foreground hover:bg-muted"
        style={{ paddingInlineStart: 12 + depth * 12 }}
      >
        {item.icon ? <LucideIcon name={iconKey(item.icon)} size={15} /> : null}
        {item.label}
      </SectionLink>
      {/* Nesting is still shown when the accordion is off — just always open. */}
      {children.map((child) => (
        <MobileNavItem
          key={child.id}
          item={child}
          depth={depth + 1}
          mobile={mobile}
          isPreview={isPreview}
          onNavigate={onNavigate}
        />
      ))}
    </>
  )
}

export function MobileNavPanel ({
  open,
  onClose,
  items,
  mobile,
  isPreview,
  actions,
}: {
  open: boolean
  onClose: () => void
  items: NavItem[]
  mobile: ChromeMobileSettings
  isPreview: boolean
  /** Buttons repeated inside the panel (CTA, sign in, …). */
  actions?: ReactNode
}) {
  if (!open) return null
  const visible = items.filter((item) => !item.hidden)

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-foreground/20',
          mobile.backdropBlur && 'backdrop-blur-sm'
        )}
      />
      <div
        className={cn(
          'absolute flex flex-col overflow-y-auto border-border bg-background shadow-xl',
          panelPosition(mobile),
          panelAnimation(mobile)
        )}
      >
        <div className="flex items-center justify-end p-2">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex size-9 items-center justify-center rounded-md text-foreground hover:bg-muted"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
        <nav className="flex flex-col gap-0.5 px-3 pb-4">
          {visible.map((item) => (
            <MobileNavItem
              key={item.id}
              item={item}
              depth={0}
              mobile={mobile}
              isPreview={isPreview}
              onNavigate={onClose}
            />
          ))}
        </nav>
        {actions ? (
          <div className="mt-auto flex flex-col gap-2 border-t border-border p-3">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  )
}
