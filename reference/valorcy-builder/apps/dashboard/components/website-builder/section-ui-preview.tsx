'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { sectionRegistry } from '@/components/sections'
import type { ElementChromeAttributes, SectionInstance } from '@/components/sections/registry.types'
import { PublicSiteProvider } from '@/components/website-builder/public-site-context'
import { StaticComponentTreeRenderer } from '@/components/website-builder/component-tree-renderer'
import { CustomSectionSurface } from '@/components/sections/custom/custom-blank-section'
import { AnimationWrapper } from '@/components/website-builder/animation-wrapper'
import {
  designSystemToThemeCss,
  SITE_THEME_ROOT_CLASS,
} from '@/lib/builder/design-system-css-vars'
import { buildPublicElementStyleRules } from '@/lib/builder/public-element-style-rules'
import { normalizeSectionsForPublic } from '@/lib/builder/normalize-page-content'
import { localeDirection } from '@workspace/i18n'
import { DEFAULT_DESIGN_SYSTEM, type DesignSystem } from '@/lib/builder/store'
import type { BuilderDesignSystemState } from '@/lib/builder/design-system-map'
import { cn } from '@/lib/utils'

const DEFAULT_PREVIEW_WIDTH = 1280

const PREVIEW_THUMBNAIL_CSS = `
[data-section-ui-preview] section {
  min-height: unset !important;
}
`

type PreviewBaseProps = {
  designSystem: BuilderDesignSystemState | DesignSystem
  elementStyles?: Record<string, CSSProperties>
  elementAttributes?: Record<string, ElementChromeAttributes>
  projectLogoUrl?: string | null
  projectName?: string | null
  defaultLocale?: string
  /**
   * Locale to render the preview in. Defaults to `defaultLocale`, which is what
   * palette/thumbnail previews want: the site's own language, with the matching
   * `dir` so RTL projects preview right-to-left.
   */
  locale?: string
  supportedLocales?: string[]
  fallbackLabel?: string
  className?: string
  previewWidth?: number
  /** Clips preview to a fixed height (px). Used by project cards on /projects. */
  viewportHeight?: number
  /** Scroll clipped content on ancestor `.group` hover when content exceeds viewportHeight. */
  scrollOnGroupHover?: boolean
}

export type SectionUiPreviewProps = PreviewBaseProps & {
  section: SectionInstance
}

export type PageUiPreviewProps = PreviewBaseProps & {
  /** Sections in render order (include shared navbar/footer yourself). */
  sections: SectionInstance[]
}

/** A single section rendered as a scaled, non-interactive thumbnail. */
export function SectionUiPreview ({ section, ...rest }: SectionUiPreviewProps) {
  return <PageUiPreview sections={[section]} {...rest} />
}

/**
 * A stack of sections (a whole page) rendered at a virtual desktop width and
 * scaled down to its container — no iframe, theme CSS included so dark mode and
 * the project's design tokens match the real site.
 */
export function PageUiPreview ({
  sections,
  designSystem,
  elementStyles,
  elementAttributes,
  projectLogoUrl = null,
  projectName = null,
  defaultLocale = 'en',
  locale,
  supportedLocales,
  fallbackLabel,
  className,
  previewWidth = DEFAULT_PREVIEW_WIDTH,
  viewportHeight,
  scrollOnGroupHover = false,
}: PageUiPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [layoutHeight, setLayoutHeight] = useState<number | null>(null)
  const [scrollOverflow, setScrollOverflow] = useState(0)

  const ds = (designSystem ?? DEFAULT_DESIGN_SYSTEM) as DesignSystem
  // Theme CSS (not inline vars) so html.dark can swap to the dark palette —
  // same pattern as the builder canvas / public renderer.
  const themeCss = useMemo(() => designSystemToThemeCss(ds), [ds])
  const elementStyleRules = useMemo(
    () => buildPublicElementStyleRules(elementStyles, elementAttributes),
    [elementStyles, elementAttributes]
  )
  const previewLocale = locale ?? defaultLocale
  const previewDir = localeDirection(previewLocale)
  const resolved = useMemo(
    () =>
      normalizeSectionsForPublic(sections, previewLocale, defaultLocale).filter((s) =>
        Boolean(sectionRegistry.get(s.sectionId)?.Component)
      ),
    [sections, previewLocale, defaultLocale]
  )
  const idsKey = resolved.map((s) => `${s.id}:${s.sectionId}`).join('|')
  const scaleTransform = `scale(calc(100cqw / ${previewWidth}px))`

  useEffect(() => {
    const container = containerRef.current
    const measure = measureRef.current
    if (!container || !measure) return

    const syncHeight = () => {
      const width = container.clientWidth
      if (!width) return
      const scale = width / previewWidth
      const scaledHeight = measure.offsetHeight * scale

      if (viewportHeight != null) {
        setLayoutHeight(viewportHeight)
        setScrollOverflow(Math.max(0, scaledHeight - viewportHeight))
      } else {
        setLayoutHeight(scaledHeight)
        setScrollOverflow(0)
      }
    }

    const observer = new ResizeObserver(syncHeight)
    observer.observe(container)
    observer.observe(measure)
    syncHeight()

    return () => observer.disconnect()
  }, [previewWidth, idsKey, viewportHeight])

  const containerHeight = viewportHeight ?? layoutHeight ?? undefined
  const canScrollOnHover = scrollOnGroupHover && scrollOverflow > 0

  if (!resolved.length) {
    return (
      <div
        className={cn(
          'flex w-full items-center justify-center bg-muted/40',
          viewportHeight == null && 'py-10',
          className
        )}
        style={viewportHeight != null ? { height: viewportHeight } : undefined}
      >
        <span className="text-3xl font-bold uppercase text-foreground/10 select-none">
          {fallbackLabel?.charAt(0) ?? '?'}
        </span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        '@container relative w-full overflow-hidden bg-background text-foreground',
        SITE_THEME_ROOT_CLASS,
        className
      )}
      style={{
        height: containerHeight,
        ...(canScrollOnHover
          ? ({ '--preview-scroll': `${scrollOverflow}px` } as CSSProperties)
          : {}),
      }}
    >
      {themeCss ? <style>{themeCss}</style> : null}
      <div
        className={cn(
          'absolute start-0 top-0 w-full',
          canScrollOnHover &&
            'transition-transform duration-[1.4s] ease-in-out group-hover:-translate-y-[var(--preview-scroll)]'
        )}
      >
        <div
          ref={measureRef}
          className="pointer-events-none origin-top-left"
          style={{
            width: previewWidth,
            transform: scaleTransform,
          }}
        >
          <PublicSiteProvider
            designSystem={ds}
            sections={resolved}
            projectLogoUrl={projectLogoUrl}
            projectName={projectName}
            supportedLocales={supportedLocales ?? [defaultLocale]}
            defaultLocale={defaultLocale}
          >
            <div
              data-section-ui-preview
              dir={previewDir}
              className="w-full bg-background text-foreground"
            >
              <style>{PREVIEW_THUMBNAIL_CSS}</style>
              {ds.customCss ? <style>{ds.customCss}</style> : null}
              {elementStyleRules ? <style>{elementStyleRules}</style> : null}
              {resolved.map((instance) => {
                const Component = sectionRegistry.get(instance.sectionId)!.Component
                return (
                  <div key={instance.id} data-section-instance-id={instance.id} data-no-instrument>
                    <AnimationWrapper animation={instance.animation} sectionId={instance.id}>
                      <Component instance={instance} isPreview />
                      {instance.componentTree?.length ? (
                        <CustomSectionSurface instanceId={instance.id}>
                          <StaticComponentTreeRenderer
                            sectionId={instance.id}
                            tree={instance.componentTree}
                            isPreview
                            elementAttributes={elementAttributes}
                          />
                        </CustomSectionSurface>
                      ) : null}
                    </AnimationWrapper>
                  </div>
                )
              })}
            </div>
          </PublicSiteProvider>
        </div>
      </div>
    </div>
  )
}
