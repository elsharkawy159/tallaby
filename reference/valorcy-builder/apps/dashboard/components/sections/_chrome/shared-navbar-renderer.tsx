'use client'

import { useMemo, useState } from 'react'
import { cn } from '@workspace/ui/lib/utils'

import { SectionContainer } from '@/components/sections/section-container'
import { useSectionSurface } from '@/components/sections/shared'
import { LucideIcon } from '@/components/website-builder/icons/lucide-icon'
import { useBuilderStore } from '@/lib/builder/store'
import { toChromeModel } from '@/lib/builder/shared-chrome/adapters'
import { updateNavItem } from '@/lib/builder/shared-chrome/nav-tree'
import type { SectionComponentProps } from '@/components/sections/registry.types'
import type {
  ChromeComponent,
  NavigationSettings,
} from '@/lib/builder/shared-chrome/types'
import { ChromeComponentRenderer } from './chrome-component-renderer'
import { NavDesktop } from './nav-desktop'
import { MobileNavPanel } from './nav-mobile'
import { navbarPreset } from './presets'
import { useStorefrontChrome } from './use-storefront-chrome'
import { isVisibleForRender, visibilityClasses } from './visibility'

/**
 * The one renderer behind every `navbar-*` section.
 *
 * Layout, components, navigation and mobile behaviour all come from the chrome
 * model (derived from legacy props for sites that predate it), while the preset
 * supplies the visual identity each navbar id has always had. That split is what
 * lets nested navigation, component ordering and responsive visibility work on
 * every variant without 6 copies of the logic.
 */

const DEFAULT_NAV_SETTINGS: NavigationSettings = {
  desktopLayout: 'inline',
  mobileLayout: 'drawer',
  gap: 4,
  alignment: 'center',
  dropdownAnimation: 'fade',
  hoverDelay: 120,
  trigger: 'hover',
}

export function SharedNavbarRenderer ({ instance, isPreview = false }: SectionComponentProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { rootStyle, ds } = useSectionSurface({ instanceId: instance.id })
  const storefront = useStorefrontChrome()

  const model = useMemo(() => toChromeModel(instance), [instance])
  const preset = navbarPreset(instance.sectionId)

  // Canvas-only inline editing writes straight back through the store's single
  // chrome write path, so an inline edit is one undo step like any other.
  const chromeRole = useBuilderStore((s) =>
    s.sharedHeader?.id === instance.id ? ('header' as const) : null
  )
  const updateChrome = useBuilderStore((s) => s.updateChrome)

  const onLabelChange = chromeRole
    ? (itemId: string, label: string) =>
        updateChrome(chromeRole, (m) => {
          m.navigation = updateNavItem(m.navigation, itemId, { label, auto: false })
        })
    : undefined

  const onSettingChange = chromeRole
    ? (componentId: string, patch: Record<string, unknown>) =>
        updateChrome(chromeRole, (m) => {
          const target = m.components.find((c) => c.id === componentId)
          if (target) Object.assign(target.settings, patch)
        })
    : undefined

  const navigationComponent = model.components.find((c) => c.type === 'navigation')
  const navSettings = {
    ...DEFAULT_NAV_SETTINGS,
    ...(navigationComponent?.settings as Partial<NavigationSettings> | undefined),
  }

  const componentCtx = {
    instanceId: instance.id,
    isPreview,
    ds,
    ctaClass: preset.ctaClass,
    secondaryClass: preset.secondaryClass,
    onSettingChange,
  }

  const renderable = model.components.filter(
    (c) =>
      c.enabled &&
      c.type !== 'navigation' &&
      isVisibleForRender(c.visibility, { isPreview, isSignedIn: storefront.isSignedIn })
  )

  const slot = (name: ChromeComponent['slot']) =>
    renderable.filter((c) => c.slot === name)

  const renderSlot = (components: ChromeComponent[], className?: string) =>
    components.length === 0 ? null : (
      <div className={cn('items-center', className)} style={{ gap: model.appearance.gap }}>
        {components.map((component) => (
          <span
            key={component.id}
            className={cn('inline-flex items-center', visibilityClasses(component.visibility))}
          >
            <ChromeComponentRenderer component={component} ctx={componentCtx} />
          </span>
        ))}
      </div>
    )

  const nav =
    navigationComponent?.enabled !== false ? (
      <NavDesktop
        items={model.navigation}
        ctx={{
          instanceId: instance.id,
          isPreview,
          linkClass: preset.linkClass,
          settings: navSettings,
          onLabelChange,
        }}
        className={cn(
          preset.navClass ?? 'hidden items-center md:flex',
          navSettings.alignment === 'start' && 'justify-start',
          navSettings.alignment === 'end' && 'justify-end'
        )}
      />
    ) : null

  const sticky = preset.alwaysSticky || model.behavior.sticky
  const surfaceStyle = preset.surface?.(ds.colors) ?? {}

  const bar = (
    <>
      {renderSlot(slot('start'), 'flex shrink-0')}
      {preset.logoDivider ? (
        <span className="hidden h-6 w-px flex-shrink-0 bg-border md:block" aria-hidden />
      ) : null}
      {nav}
      {/* The centred nav is absolutely positioned and `inline-grow` navs already
          take the free space, so only an inline nav (or a missing one) needs a
          spacer to push the end slot over. */}
      {preset.navPlacement === 'inline' || (preset.navPlacement === 'inline-grow' && !nav) ? (
        <span className="flex-1" />
      ) : null}
      {renderSlot(slot('center'), 'hidden md:flex')}
      {renderSlot(slot('end'), 'hidden md:flex')}

      {/* Mobile trigger — always rendered so a phone can still reach the menu. */}
      <button
        type="button"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-foreground md:hidden"
        aria-label="Toggle menu"
        aria-expanded={mobileOpen}
        onClick={(e) => {
          e.stopPropagation()
          setMobileOpen((v) => !v)
        }}
      >
        <LucideIcon name={model.mobile.hamburgerIcon || 'menu'} size={18} />
      </button>
    </>
  )

  return (
    <header
      className={cn(preset.headerClass, sticky && !preset.alwaysSticky && 'sticky top-0 z-50')}
      style={{ ...rootStyle, ...surfaceStyle, ...(rootStyle.backgroundColor ? { backgroundColor: rootStyle.backgroundColor } : {}) }}
    >
      <SectionContainer>
        {preset.pill ? (
          <>
            <nav
              className={cn('hidden md:inline-flex', preset.pillClass)}
              style={preset.pillSurface?.(ds.colors)}
            >
              {bar}
            </nav>
            <div className="flex items-center justify-between md:hidden">{bar}</div>
          </>
        ) : (
          <div className={preset.barClass}>{bar}</div>
        )}
      </SectionContainer>

      <MobileNavPanel
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={model.navigation}
        mobile={model.mobile}
        isPreview={isPreview}
        actions={
          slot('end').length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {slot('end').map((component) => (
                <ChromeComponentRenderer
                  key={component.id}
                  component={component}
                  ctx={componentCtx}
                />
              ))}
            </div>
          ) : null
        }
      />
    </header>
  )
}
