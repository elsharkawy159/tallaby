import type { ComponentStyle } from '@/lib/builder/component-style'

/** py-24 / md:py-32 */
export const SECTION_PADDING_STANDARD: Partial<ComponentStyle> = {
  paddingTop: '6rem',
  paddingBottom: '6rem',
}

/** py-20 / md:py-28 */
export const SECTION_PADDING_MEDIUM: Partial<ComponentStyle> = {
  paddingTop: '5rem',
  paddingBottom: '5rem',
}

/** py-28 / md:py-36 */
export const SECTION_PADDING_XL: Partial<ComponentStyle> = {
  paddingTop: '7rem',
  paddingBottom: '9rem',
}

/** py-16 */
export const SECTION_PADDING_TIGHT: Partial<ComponentStyle> = {
  paddingTop: '4rem',
  paddingBottom: '4rem',
}

/** py-12 */
export const SECTION_PADDING_COMPACT: Partial<ComponentStyle> = {
  paddingTop: '3rem',
  paddingBottom: '3rem',
}

/** py-14 */
export const SECTION_PADDING_RELAXED: Partial<ComponentStyle> = {
  paddingTop: '3.5rem',
  paddingBottom: '3.5rem',
}

/** py-10 */
export const SECTION_PADDING_SMALL: Partial<ComponentStyle> = {
  paddingTop: '2.5rem',
  paddingBottom: '2.5rem',
}

/** py-8 */
export const SECTION_PADDING_INLINE: Partial<ComponentStyle> = {
  paddingTop: '2rem',
  paddingBottom: '2rem',
}

/** py-5 */
export const SECTION_PADDING_LOGOS: Partial<ComponentStyle> = {
  paddingTop: '1.25rem',
  paddingBottom: '1.25rem',
}

/** py-4 */
export const SECTION_PADDING_XS: Partial<ComponentStyle> = {
  paddingTop: '1rem',
  paddingBottom: '1rem',
}

/** Muted / tinted section roots — keep Tailwind bg-* */
export const SECTION_ROOT_MUTED = {
  defaultBackground: false as const,
  applySectionPadding: false as const,
}
