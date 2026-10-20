'use client'

import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

import { Button } from '@workspace/ui/components/button'
import { Input } from '@workspace/ui/components/input'
import { Label } from '@workspace/ui/components/label'
import { Switch } from '@workspace/ui/components/switch'

import { NumberField, StyleSelect } from '@/components/website-builder/controls'
import { useBuilderStore } from '@/lib/builder/store'
import { countNavItems } from '@/lib/builder/shared-chrome/nav-tree'
import type { ChromeRole } from '@/lib/builder/shared-chrome/types'
import { ComponentList } from './component-list'
import { InspectorGroups, InspectorSearchProvider, type InspectorGroupSpec } from './inspector-group'
import { NavigationManager } from './navigation-manager'
import { useChromeModel } from './use-chrome-model'

/**
 * The dedicated inspector for the shared navbar / footer.
 *
 * Replaces the generic section settings whenever a shared slot is selected —
 * everything here writes through `updateChrome`, so each edit is one undo step
 * and autosave picks it up with no extra wiring.
 */
export function ChromeInspector ({ role }: { role: ChromeRole }) {
  const [query, setQuery] = useState('')
  const { model, update } = useChromeModel(role)

  const pages = useBuilderStore((s) => s.pages)
  const activePageId = useBuilderStore((s) => s.activePageId)
  const togglePageUseSharedHeader = useBuilderStore((s) => s.togglePageUseSharedHeader)
  const togglePageUseSharedFooter = useBuilderStore((s) => s.togglePageUseSharedFooter)
  const activePage = pages.find((p) => p.id === activePageId)

  const groups = useMemo<InspectorGroupSpec[]>(() => {
    if (!model) return []
    const enabledCount = model.components.filter((c) => c.enabled).length

    const general: InspectorGroupSpec = {
      id: 'general',
      title: 'General',
      icon: 'settings-2',
      keywords: ['page', 'shared', 'width', 'container', 'alignment', 'sticky'],
      content: (
        <>
          {activePage ? (
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="chrome-use-shared" className="text-[10px]">
                Show on this page
              </Label>
              <Switch
                id="chrome-use-shared"
                checked={
                  role === 'header'
                    ? (activePage.useSharedHeader ?? true)
                    : (activePage.useSharedFooter ?? true)
                }
                onCheckedChange={() =>
                  role === 'header'
                    ? togglePageUseSharedHeader(activePage.id)
                    : togglePageUseSharedFooter(activePage.id)
                }
              />
            </div>
          ) : null}
          <StyleSelect
            label="Container width"
            value={model.appearance.containerWidth}
            onValueChange={(v) =>
              update((m) => {
                m.appearance.containerWidth = v as typeof m.appearance.containerWidth
              })
            }
            options={[
              { value: 'boxed', label: 'Boxed' },
              { value: 'wide', label: 'Wide' },
              { value: 'full', label: 'Full width' },
            ]}
            allowEmpty={false}
          />
          <p className="text-[10px] text-muted-foreground">
            Applies to every page that uses this shared {role}.
          </p>
        </>
      ),
    }

    const brand: InspectorGroupSpec = {
      id: 'brand',
      title: 'Brand',
      icon: 'image',
      keywords: ['logo', 'brand', 'wordmark', 'image'],
      content: (
        <>
          <div className="flex flex-col gap-1">
            <Label htmlFor="chrome-logo-text" className="text-[10px]">
              Brand name
            </Label>
            <Input
              id="chrome-logo-text"
              className="h-7 text-xs"
              value={model.branding.logoText ?? ''}
              onChange={(e) =>
                update((m) => {
                  m.branding.logoText = e.target.value
                  const logo = m.components.find((c) => c.type === 'logo')
                  if (logo) logo.settings.text = e.target.value
                })
              }
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="chrome-logo-image" className="text-[10px]">
              Logo image URL
            </Label>
            <Input
              id="chrome-logo-image"
              className="h-7 font-mono text-[10px]"
              placeholder="https://…"
              value={model.branding.logoImage ?? ''}
              onChange={(e) =>
                update((m) => {
                  m.branding.logoImage = e.target.value || undefined
                  const logo = m.components.find((c) => c.type === 'logo')
                  if (logo) logo.settings.image = e.target.value || undefined
                })
              }
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Size and click behaviour live on the Logo component.
          </p>
        </>
      ),
    }

    const navigation: InspectorGroupSpec = {
      id: 'navigation',
      title: 'Navigation',
      icon: 'menu',
      keywords: ['links', 'menu', 'nested', 'dropdown', 'pages', 'order'],
      meta: `${countNavItems(model.navigation)} items`,
      content: <NavigationManager role={role} model={model} update={update} />,
    }

    const components: InspectorGroupSpec = {
      id: 'components',
      title: 'Components',
      icon: 'layout-grid',
      keywords: [
        'logo',
        'cta',
        'button',
        'theme',
        'language',
        'search',
        'login',
        'register',
        'avatar',
        'cart',
        'wishlist',
        'notifications',
        'social',
        'newsletter',
        'copyright',
        'policies',
        'visibility',
      ],
      meta: `${enabledCount}/${model.components.length} on`,
      content: <ComponentList role={role} model={model} update={update} />,
    }

    const appearance: InspectorGroupSpec = {
      id: 'appearance',
      title: 'Appearance',
      icon: 'palette',
      keywords: ['gap', 'spacing', 'alignment', 'layout'],
      content: (
        <>
          <NumberField
            label="Gap between items"
            value={String(model.appearance.gap)}
            onValueChange={(v) =>
              update((m) => {
                m.appearance.gap = Number(v) || 0
              })
            }
            min={0}
            max={64}
          />
          <StyleSelect
            label="Alignment"
            value={model.appearance.alignment}
            onValueChange={(v) =>
              update((m) => {
                m.appearance.alignment = v as typeof m.appearance.alignment
              })
            }
            options={[
              { value: 'start', label: 'Start' },
              { value: 'center', label: 'Center' },
              { value: 'end', label: 'End' },
              { value: 'between', label: 'Space between' },
            ]}
            allowEmpty={false}
          />
          <p className="text-[10px] text-muted-foreground">
            Colors, padding and borders live in the Style tab.
          </p>
        </>
      ),
    }

    const behavior: InspectorGroupSpec = {
      id: 'behavior',
      title: 'Behavior',
      icon: 'move-vertical',
      keywords: ['sticky', 'scroll', 'shadow', 'fixed'],
      content: (
        <>
          <SwitchRow
            id="chrome-sticky"
            label="Stick to the top on scroll"
            checked={model.behavior.sticky}
            onChange={(sticky) =>
              update((m) => {
                m.behavior.sticky = sticky
              })
            }
          />
          <SwitchRow
            id="chrome-hide-scroll"
            label="Hide when scrolling down"
            checked={model.behavior.hideOnScroll}
            onChange={(hideOnScroll) =>
              update((m) => {
                m.behavior.hideOnScroll = hideOnScroll
              })
            }
          />
          <SwitchRow
            id="chrome-shadow-scroll"
            label="Shadow once scrolled"
            checked={model.behavior.shadowOnScroll}
            onChange={(shadowOnScroll) =>
              update((m) => {
                m.behavior.shadowOnScroll = shadowOnScroll
              })
            }
          />
        </>
      ),
    }

    const mobile: InspectorGroupSpec = {
      id: 'mobile',
      title: 'Mobile navigation',
      icon: 'smartphone',
      keywords: ['drawer', 'hamburger', 'overlay', 'breakpoint', 'backdrop', 'accordion'],
      content: (
        <>
          <StyleSelect
            label="Mode"
            value={model.mobile.mode}
            onValueChange={(v) =>
              update((m) => {
                m.mobile.mode = v as typeof m.mobile.mode
              })
            }
            options={[
              { value: 'drawer', label: 'Slide-in drawer' },
              { value: 'fullscreen', label: 'Fullscreen' },
              { value: 'overlay', label: 'Overlay panel' },
            ]}
            allowEmpty={false}
          />
          <StyleSelect
            label="Slide direction"
            value={model.mobile.direction}
            onValueChange={(v) =>
              update((m) => {
                m.mobile.direction = v as typeof m.mobile.direction
              })
            }
            options={[
              { value: 'left', label: 'From the left' },
              { value: 'right', label: 'From the right' },
              { value: 'top', label: 'From the top' },
              { value: 'bottom', label: 'From the bottom' },
            ]}
            allowEmpty={false}
          />
          <StyleSelect
            label="Animation"
            value={model.mobile.animation}
            onValueChange={(v) =>
              update((m) => {
                m.mobile.animation = v as typeof m.mobile.animation
              })
            }
            options={[
              { value: 'slide', label: 'Slide' },
              { value: 'fade', label: 'Fade' },
              { value: 'scale', label: 'Scale' },
            ]}
            allowEmpty={false}
          />
          <NumberField
            label="Breakpoint"
            hint="px"
            value={String(model.mobile.breakpoint)}
            onValueChange={(v) =>
              update((m) => {
                m.mobile.breakpoint = Number(v) || 768
              })
            }
            min={320}
            max={1536}
            step={1}
          />
          <SwitchRow
            id="chrome-backdrop"
            label="Blur the backdrop"
            checked={model.mobile.backdropBlur}
            onChange={(backdropBlur) =>
              update((m) => {
                m.mobile.backdropBlur = backdropBlur
              })
            }
          />
          <SwitchRow
            id="chrome-close-click"
            label="Close after tapping a link"
            checked={model.mobile.closeOnClick}
            onChange={(closeOnClick) =>
              update((m) => {
                m.mobile.closeOnClick = closeOnClick
              })
            }
          />
          <SwitchRow
            id="chrome-nested-accordion"
            label="Nested links as accordion"
            checked={model.mobile.nestedAccordion}
            onChange={(nestedAccordion) =>
              update((m) => {
                m.mobile.nestedAccordion = nestedAccordion
              })
            }
          />
        </>
      ),
    }

    const advanced: InspectorGroupSpec = {
      id: 'advanced',
      title: 'Advanced',
      icon: 'wrench',
      keywords: ['preset', 'reset', 'sync', 'debug'],
      content: (
        <>
          <div className="flex flex-col gap-1">
            <Label className="text-[10px]">Preset</Label>
            <p className="rounded border border-border bg-muted/40 px-2 py-1 font-mono text-[10px] text-muted-foreground">
              {model.preset}
            </p>
          </div>
          <SwitchRow
            id="chrome-nav-synced"
            label="Navigation follows site pages"
            checked={model.navSynced}
            onChange={(navSynced) =>
              update((m) => {
                m.navSynced = navSynced
              })
            }
          />
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            When on, adding or renaming a page updates the matching navigation
            items. Editing the navigation turns this off automatically.
          </p>
        </>
      ),
    }

    return role === 'header'
      ? [general, brand, navigation, components, appearance, behavior, mobile, advanced]
      : [general, brand, navigation, components, appearance, advanced]
  }, [
    model,
    role,
    update,
    activePage,
    togglePageUseSharedHeader,
    togglePageUseSharedFooter,
  ])

  if (!model) {
    return (
      <p className="px-1 py-2 text-sm text-muted-foreground">
        This shared {role} is no longer available.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-1 py-2">
      <div className="relative">
        <Search className="pointer-events-none absolute start-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search settings…"
          className="h-7 ps-7 pe-7 text-xs"
          aria-label="Search shared chrome settings"
        />
        {query ? (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute end-0.5 top-1/2 size-6 -translate-y-1/2"
            aria-label="Clear search"
            onClick={() => setQuery('')}
          >
            <X className="size-3" />
          </Button>
        ) : null}
      </div>

      <InspectorSearchProvider query={query}>
        <InspectorGroups groups={groups} defaultOpen={['navigation', 'components']} />
      </InspectorSearchProvider>
    </div>
  )
}

function SwitchRow ({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Label htmlFor={id} className="text-[10px]">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
