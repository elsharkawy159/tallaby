import type { ComponentStyle } from '@/lib/builder/component-style'

/**
 * Pure helpers for design-system section padding. Kept free of the builder store /
 * React so both the store (section creation) and section-surface (render) can import
 * them without a circular dependency.
 */

/**
 * Section categories that manage their own vertical spacing (compact bars / tight
 * strips) and should NOT inherit the design-system sectionPaddingY default.
 */
export const DS_PADDING_EXCLUDED_CATEGORIES = new Set(['navbar', 'logo-cloud'])

export function sectionFollowsDsPadding (category?: string): boolean {
  return !!category && !DS_PADDING_EXCLUDED_CATEGORIES.has(category)
}

/**
 * Drops paddingTop/paddingBottom/padding from a style object so the design-system
 * sectionPaddingY fallback can drive the value. Used to strip the registry *default*
 * (preset) layer, and at section-creation/AI-generation sites so preset padding is
 * never baked into a section's persisted `style`.
 */
export function stripDsPaddingKeys<T extends Partial<ComponentStyle>> (style: T): T {
  const rest = { ...style } as Record<string, unknown>
  delete rest.paddingTop
  delete rest.paddingBottom
  delete rest.padding
  return rest as T
}

/**
 * Drops instance padding that is a verbatim copy of the registry preset (baked into
 * `instance.style` at creation time) so the design-system sectionPaddingY fallback can
 * drive it. A genuine user override has a value different from the preset and is kept.
 */
export function stripBakedInstancePadding (
  instanceStyle: ComponentStyle | undefined,
  preset: Partial<ComponentStyle> | undefined
): ComponentStyle | undefined {
  if (!instanceStyle || !preset) return instanceStyle
  const out = { ...instanceStyle } as Record<string, unknown>
  for (const k of ['paddingTop', 'paddingBottom', 'padding'] as const) {
    if (out[k] != null && preset[k] != null && out[k] === preset[k]) delete out[k]
  }
  return out as ComponentStyle
}
