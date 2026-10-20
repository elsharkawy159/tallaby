'use client'

import { useMemo } from 'react'

import { cn } from '@workspace/ui/lib/utils'

import { SectionContainer } from '@/components/sections/section-container'
import { useSectionSurface } from '@/components/sections/shared'
import { SectionLink } from '@/components/website-builder/section-link'
import { useBuilderStore } from '@/lib/builder/store'
import { toChromeModel } from '@/lib/builder/shared-chrome/adapters'
import type { SectionComponentProps } from '@/components/sections/registry.types'
import type { ChromeComponent, NavItem } from '@/lib/builder/shared-chrome/types'
import { ChromeComponentRenderer } from './chrome-component-renderer'
import { footerPreset } from './presets'
import { withNewTab } from './link-utils'
import { useStorefrontChrome } from './use-storefront-chrome'
import { isVisibleForRender, visibilityClasses } from './visibility'

/**
 * The one renderer behind every `footer-*` section.
 *
 * Mirrors `SharedNavbarRenderer`: the model supplies brand, link columns,
 * socials, newsletter, policies and copyright; the preset supplies the layout
 * and surface each footer id has always had. Footer navigation is the same
 * `NavItem` tree as the navbar's — top-level items become columns and their
 * children become that column's links.
 */

function FooterColumn ({
  column,
  isPreview,
  linkClass,
}: {
  column: NavItem
  isPreview: boolean
  linkClass: string
}) {
  const links = (column.children ?? []).filter((c) => !c.hidden)
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
        {column.label}
      </p>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.id}>
            <SectionLink
              link={withNewTab(link.link, link.newTab)}
              isPreview={isPreview}
              className={linkClass}
            >
              {link.label}
            </SectionLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SharedFooterRenderer ({ instance, isPreview = false }: SectionComponentProps) {
  const { rootStyle, ds } = useSectionSurface({ instanceId: instance.id })
  const storefront = useStorefrontChrome()

  const model = useMemo(() => toChromeModel(instance), [instance])
  const preset = footerPreset(instance.sectionId)

  const chromeRole = useBuilderStore((s) =>
    s.sharedFooter?.id === instance.id ? ('footer' as const) : null
  )
  const updateChrome = useBuilderStore((s) => s.updateChrome)

  const onSettingChange = chromeRole
    ? (componentId: string, patch: Record<string, unknown>) =>
        updateChrome(chromeRole, (m) => {
          const target = m.components.find((c) => c.id === componentId)
          if (target) Object.assign(target.settings, patch)
        })
    : undefined

  const componentCtx = { instanceId: instance.id, isPreview, ds, onSettingChange }

  const renderable = model.components.filter(
    (c) =>
      c.enabled &&
      isVisibleForRender(c.visibility, { isPreview, isSignedIn: storefront.isSignedIn })
  )
  const byType = (types: ChromeComponent['type'][]) =>
    renderable.filter((c) => types.includes(c.type))

  const render = (components: ChromeComponent[]) =>
    components.map((component) => (
      <div
        key={component.id}
        className={cn('flex items-center', visibilityClasses(component.visibility))}
      >
        <ChromeComponentRenderer component={component} ctx={componentCtx} />
      </div>
    ))

  const columns = model.navigation.filter((item) => !item.hidden)
  const brand = byType(['logo', 'customBlock', 'social'])
  const extras = byType(['newsletter', 'cta', 'customButton', 'languageSwitcher', 'themeToggle'])
  const legal = byType(['legal'])
  const copyright = byType(['copyright'])

  const columnCount = preset.columns ?? 4

  return (
    <footer
      className={cn(preset.footerClass, preset.dark && 'text-white')}
      style={{ ...rootStyle, ...(preset.surface?.(ds.colors) ?? {}) }}
    >
      <SectionContainer>
        {preset.layout === 'columns' ? (
          <div className="grid grid-cols-2 gap-10 md:grid-cols-12 md:gap-8">
            <div className="col-span-2 flex flex-col gap-4 md:col-span-4">{render(brand)}</div>
            <div
              className="col-span-2 grid gap-8 md:col-span-8"
              style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
            >
              {columns.map((column) => (
                <FooterColumn
                  key={column.id}
                  column={column}
                  isPreview={isPreview}
                  linkClass={preset.linkClass}
                />
              ))}
            </div>
            {extras.length > 0 ? (
              <div className="col-span-2 flex flex-col gap-4 md:col-span-12">{render(extras)}</div>
            ) : null}
          </div>
        ) : preset.layout === 'stacked' ? (
          <div className="flex flex-col items-center gap-6 text-center">
            {render(brand)}
            {columns.length > 0 ? (
              <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                {columns.flatMap((column) =>
                  (column.children?.length ? column.children : [column])
                    .filter((c) => !c.hidden)
                    .map((link) => (
                      <SectionLink
                        key={link.id}
                        link={withNewTab(link.link, link.newTab)}
                        isPreview={isPreview}
                        className={preset.linkClass}
                      >
                        {link.label}
                      </SectionLink>
                    ))
                )}
              </nav>
            ) : null}
            {render(extras)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-4">{render(brand)}</div>
            {columns.length > 0 ? (
              <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {columns.flatMap((column) =>
                  (column.children?.length ? column.children : [column])
                    .filter((c) => !c.hidden)
                    .map((link) => (
                      <SectionLink
                        key={link.id}
                        link={withNewTab(link.link, link.newTab)}
                        isPreview={isPreview}
                        className={preset.linkClass}
                      >
                        {link.label}
                      </SectionLink>
                    ))
                )}
              </nav>
            ) : null}
            <div className="flex items-center gap-4">{render(extras)}</div>
          </div>
        )}

        {legal.length > 0 || copyright.length > 0 ? (
          <div
            className={cn(
              'mt-8 flex flex-col items-center justify-between gap-3 border-t pt-5 md:flex-row',
              preset.dark ? 'border-white/10' : 'border-border/60'
            )}
          >
            {render(copyright)}
            {render(legal)}
          </div>
        ) : null}
      </SectionContainer>
    </footer>
  )
}
