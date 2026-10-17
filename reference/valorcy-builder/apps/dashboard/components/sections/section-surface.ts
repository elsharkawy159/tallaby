'use client'

import type { CSSProperties } from 'react'
import { usePublicSiteContext } from '@/components/website-builder/public-site-context'
import { useBuilderStore, type DesignSystem } from '@/lib/builder/store'
import type { SectionInstance } from '@/components/sections/registry.types'
import {
  componentStyleToCss,
  getEffectiveComponentStyleForBreakpoint,
  type ComponentStyle,
  type ViewportBreakpoint,
} from '@/lib/builder/component-style'
import { designSystemCssRefs } from '@/lib/builder/design-system-css-vars'
import {
  sectionFollowsDsPadding,
  stripDsPaddingKeys,
  stripBakedInstancePadding,
} from '@/components/sections/ds-padding'

export type SectionRootStyleOptions = {
  /** Fallback when user has not set backgroundColor in Design panel. Use `false` to keep Tailwind bg-* classes only. */
  defaultBackground?: string | false
  /** Fallback when user has not set color in Design panel */
  defaultColor?: string
  /** Apply designSystem.spacing.sectionPaddingY when padding is unset (default true) */
  applySectionPadding?: boolean
}

/** Strips the registry-default (preset) padding layer so DS sectionPaddingY can drive it. */
const stripDefaultPadding = stripDsPaddingKeys

type UseSectionSurfaceArgs = {
  instanceId: string
  defaultStyle?: Partial<ComponentStyle>
  rootOptions?: SectionRootStyleOptions
}

export function buildSectionRootStyle (
  css: CSSProperties,
  ds: DesignSystem,
  options?: SectionRootStyleOptions
): CSSProperties {
  const padY = ds.spacing.sectionPaddingY
  const defaults: CSSProperties = {}

  if (!css.backgroundColor && options?.defaultBackground !== false) {
    defaults.backgroundColor =
      (typeof options?.defaultBackground === 'string'
        ? options.defaultBackground
        : undefined) ?? 'var(--background)'
  }
  if (!css.color) {
    defaults.color = options?.defaultColor ?? 'var(--foreground)'
  }
  if (options?.applySectionPadding !== false && padY != null) {
    if (!css.paddingTop && !css.padding) {
      defaults.paddingTop = `${padY}px`
    }
    if (!css.paddingBottom && !css.padding) {
      defaults.paddingBottom = `${padY}px`
    }
  }

  return { ...defaults, ...css }
}

type GetSectionPanelStyleArgs = {
  instance: SectionInstance
  defaultStyle?: Partial<ComponentStyle>
  rootOptions?: SectionRootStyleOptions
  viewport: ViewportBreakpoint
  designSystem: DesignSystem
  /** Section category — drives whether design-system sectionPaddingY applies. */
  category?: string
}

/**
 * Resolved section style for the Design panel — matches what the canvas renders
 * (registry defaults, breakpoint overrides, design-system fallbacks).
 */
export function getSectionPanelStyle ({
  instance,
  defaultStyle,
  rootOptions,
  viewport,
  designSystem,
  category,
}: GetSectionPanelStyleArgs): ComponentStyle {
  const followsDs = sectionFollowsDsPadding(category)
  const effectiveDefaultStyle = followsDs
    ? stripDefaultPadding(defaultStyle ?? {})
    : defaultStyle
  const effectiveRootOptions = followsDs
    ? { ...(rootOptions ?? {}), applySectionPadding: true }
    : rootOptions
  const effectiveInstanceStyle = followsDs
    ? stripBakedInstancePadding(instance.style, defaultStyle)
    : instance.style

  const merged = getEffectiveComponentStyleForBreakpoint(
    effectiveInstanceStyle,
    effectiveDefaultStyle,
    instance.breakpointStyles,
    viewport
  )
  const css = componentStyleToCss(merged)
  const rootStyle = buildSectionRootStyle(css, designSystem, effectiveRootOptions)
  return { ...merged, ...rootStyle } as ComponentStyle
}

export function useSectionSurface ({
  instanceId,
  defaultStyle,
  rootOptions,
}: UseSectionSurfaceArgs) {
  const publicSite = usePublicSiteContext()
  const storeDesignSystem = useBuilderStore((s) => s.designSystem)
  const storeDeviceMode = useBuilderStore((s) => s.deviceMode)
  const storeSections = useBuilderStore((s) => s.sections)
  const storeSharedHeader = useBuilderStore((s) => s.sharedHeader)
  const storeSharedFooter = useBuilderStore((s) => s.sharedFooter)

  const rawDesignSystem = publicSite?.designSystem ?? storeDesignSystem
  const designSystem = designSystemCssRefs(rawDesignSystem)
  const deviceMode = publicSite?.deviceMode ?? storeDeviceMode
  // Shared header/footer live outside `sections` (in their own store slots), so in
  // the canvas they aren't found by the array lookup. Without the instance we lose
  // the section definition — and with it the navbar's `applySectionPadding: false`,
  // which makes the canvas apply the design-system sectionPaddingY (extra Y padding
  // not present on the published site). Fall back to the shared slots so the canvas
  // matches the public renderer.
  const instance =
    (publicSite?.sections ?? storeSections).find((x) => x.id === instanceId) ??
    (storeSharedHeader?.id === instanceId
      ? storeSharedHeader
      : storeSharedFooter?.id === instanceId
        ? storeSharedFooter
        : undefined)
  const sectionDef = instance ? getSectionDefinition(instance.sectionId) : undefined
  const followsDs = sectionFollowsDsPadding(sectionDef?.category)
  const baseDefaultStyle = {
    ...(sectionDef?.defaultStyle ?? {}),
    ...(defaultStyle ?? {}),
  }
  const mergedDefaultStyle = followsDs
    ? stripDefaultPadding(baseDefaultStyle)
    : baseDefaultStyle
  const baseRootOptions = {
    ...(sectionDef?.rootStyleOptions ?? {}),
    ...(rootOptions ?? {}),
  }
  const mergedRootOptions = followsDs
    ? { ...baseRootOptions, applySectionPadding: true }
    : baseRootOptions
  const effectiveInstanceStyle = followsDs
    ? stripBakedInstancePadding(instance?.style, sectionDef?.defaultStyle)
    : instance?.style

  const style = instance
    ? getEffectiveComponentStyleForBreakpoint(
        effectiveInstanceStyle,
        mergedDefaultStyle,
        instance.breakpointStyles,
        deviceMode
      )
    : {}

  const css = componentStyleToCss(style)
  const rootStyle = buildSectionRootStyle(css, designSystem, mergedRootOptions)

  return {
    css,
    rootStyle,
    ds: designSystem,
    sectionStyle: style as ComponentStyle,
  }
}

function getSectionDefinition (sectionId: string) {
  const { SECTION_DEFINITIONS } =
    require('@/components/sections/section-definitions') as typeof import('@/components/sections/section-definitions')
  return SECTION_DEFINITIONS.find((d) => d.id === sectionId)
}
