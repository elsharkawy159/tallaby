/**
 * SectionOptions — the shared customization layer.
 *
 * One typed option set that every section opts into. The design panel renders it
 * generically (no per-section UI code), the AI can set any of it through the same
 * `updateSectionProps` path it already uses, and `section-surface.ts` turns it into
 * CSS custom properties on the section root so a single JSX renderer serves many
 * visual configurations without branching.
 *
 * Resolution order (last wins):
 *   design-system token → section `defaultOptions` → instance `props.__options`
 *   → per-element `elementStyles`
 *
 * Options are stored under the reserved `__options` prop key so they never collide
 * with content props and are trivially strippable for AI copy rewrite (which must
 * change content only, never layout).
 */

import type { ComponentPropDefinition } from '@/components/sections/registry.types'

/** Reserved prop key holding the per-instance option overrides. */
export const SECTION_OPTIONS_PROP = '__options'

export interface SectionOptions {
  // Layout
  containerWidth?: 'full' | 'wide' | 'default' | 'narrow'
  align?: 'start' | 'center' | 'end'
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  paddingY?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  minHeight?: 'auto' | 'half' | 'screen'

  // Media
  mediaPosition?: 'start' | 'end' | 'top' | 'bottom' | 'background'
  mediaRatio?: 'square' | 'video' | 'portrait' | 'wide' | 'auto'

  // Appearance
  background?: 'default' | 'muted' | 'accent' | 'inverted' | 'transparent'
  overlay?: boolean
  overlayOpacity?: number
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  cardStyle?: 'flat' | 'outlined' | 'elevated' | 'glass'
  theme?: 'inherit' | 'light' | 'dark'

  // Behaviour
  animation?: 'none' | 'fade' | 'slide' | 'zoom'
  visibility?: 'all' | 'desktop' | 'mobile'
}

export const SECTION_OPTION_DEFAULTS: Required<
  Pick<
    SectionOptions,
    'containerWidth' | 'align' | 'gap' | 'paddingY' | 'background' | 'radius' | 'cardStyle' | 'theme' | 'animation' | 'visibility' | 'minHeight'
  >
> = {
  containerWidth: 'default',
  align: 'start',
  gap: 'md',
  paddingY: 'lg',
  background: 'default',
  radius: 'lg',
  cardStyle: 'outlined',
  theme: 'inherit',
  animation: 'none',
  visibility: 'all',
  minHeight: 'auto',
}

// ─── CSS custom-property mapping ──────────────────────────────────────────────

const GAP_SCALE: Record<NonNullable<SectionOptions['gap']>, string> = {
  none: '0px',
  sm: '0.75rem',
  md: '1.5rem',
  lg: '2.5rem',
  xl: '4rem',
}

const PADDING_SCALE: Record<NonNullable<SectionOptions['paddingY']>, string> = {
  none: '0px',
  sm: '2rem',
  md: '4rem',
  lg: '6rem',
  xl: '8rem',
}

const RADIUS_SCALE: Record<NonNullable<SectionOptions['radius']>, string> = {
  none: '0px',
  sm: '0.375rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
  full: '9999px',
}

const WIDTH_SCALE: Record<NonNullable<SectionOptions['containerWidth']>, string> = {
  full: '100%',
  wide: '90rem',
  default: 'var(--container-max-width, 80rem)',
  narrow: '48rem',
}

const ALIGN_TO_FLEX: Record<NonNullable<SectionOptions['align']>, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
}

const MIN_HEIGHT_SCALE: Record<NonNullable<SectionOptions['minHeight']>, string> = {
  auto: 'auto',
  half: '50svh',
  screen: '100svh',
}

/**
 * Turns resolved options into CSS custom properties for the section root.
 * Sections consume them via Tailwind arbitrary values, e.g.
 * `gap-[var(--sec-gap)]`, `py-[var(--sec-py)]`, `max-w-[var(--sec-width)]`.
 */
export function sectionOptionsToCssVars (
  options: SectionOptions
): Record<string, string> {
  const o = { ...SECTION_OPTION_DEFAULTS, ...options }
  const vars: Record<string, string> = {
    '--sec-gap': GAP_SCALE[o.gap],
    '--sec-py': PADDING_SCALE[o.paddingY],
    '--sec-radius': RADIUS_SCALE[o.radius],
    '--sec-width': WIDTH_SCALE[o.containerWidth],
    '--sec-align': ALIGN_TO_FLEX[o.align],
    '--sec-text-align': o.align === 'center' ? 'center' : o.align === 'end' ? 'end' : 'start',
    '--sec-min-h': MIN_HEIGHT_SCALE[o.minHeight],
  }
  if (options.columns) vars['--sec-cols'] = String(options.columns)
  if (options.overlayOpacity != null) {
    vars['--sec-overlay-opacity'] = String(clamp01(options.overlayOpacity))
  }
  return vars
}

function clamp01 (n: number): number {
  return Math.max(0, Math.min(1, n))
}

/** Background option → the surface colors the section root should adopt. */
export function backgroundStyleFor (
  background: SectionOptions['background']
): { backgroundColor?: string; color?: string } {
  switch (background) {
    case 'muted':
      return { backgroundColor: 'var(--muted)', color: 'var(--foreground)' }
    case 'accent':
      return { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }
    case 'inverted':
      return { backgroundColor: 'var(--foreground)', color: 'var(--background)' }
    case 'transparent':
      return {}
    default:
      return { backgroundColor: 'var(--background)', color: 'var(--foreground)' }
  }
}

/** Reads the option bag off an instance's props. */
export function readSectionOptions (
  props: Record<string, unknown> | undefined,
  defaults?: SectionOptions
): SectionOptions {
  const raw = props?.[SECTION_OPTIONS_PROP]
  const instance = raw && typeof raw === 'object' ? (raw as SectionOptions) : {}
  return { ...defaults, ...instance }
}

// ─── Inspector schema ─────────────────────────────────────────────────────────

function select (
  key: keyof SectionOptions,
  label: string,
  values: string[],
  designGroup: ComponentPropDefinition['designGroup']
): ComponentPropDefinition {
  return {
    key: `${SECTION_OPTIONS_PROP}.${key}`,
    label,
    type: 'select',
    designGroup,
    group: designGroup === 'layout' ? 'layout' : 'appearance',
    options: values.map((v) => ({
      value: v,
      label: v.charAt(0).toUpperCase() + v.slice(1),
    })),
  }
}

/**
 * Definitions the design panel renders for every section. Declared once here
 * rather than per section — that is the whole point of the options layer.
 */
export const SECTION_OPTION_DEFINITIONS: ComponentPropDefinition[] = [
  select('containerWidth', 'Container width', ['full', 'wide', 'default', 'narrow'], 'layout'),
  select('align', 'Alignment', ['start', 'center', 'end'], 'layout'),
  select('gap', 'Gap', ['none', 'sm', 'md', 'lg', 'xl'], 'layout'),
  select('paddingY', 'Vertical padding', ['none', 'sm', 'md', 'lg', 'xl'], 'layout'),
  select('minHeight', 'Min height', ['auto', 'half', 'screen'], 'layout'),
  { key: `${SECTION_OPTIONS_PROP}.columns`, label: 'Columns', type: 'number', min: 1, max: 6, designGroup: 'layout', group: 'layout' },
  select('mediaPosition', 'Media position', ['start', 'end', 'top', 'bottom', 'background'], 'layout'),
  select('mediaRatio', 'Media ratio', ['square', 'video', 'portrait', 'wide', 'auto'], 'layout'),
  select('background', 'Background', ['default', 'muted', 'accent', 'inverted', 'transparent'], 'appearance'),
  { key: `${SECTION_OPTIONS_PROP}.overlay`, label: 'Overlay', type: 'switch', designGroup: 'appearance', group: 'appearance' },
  { key: `${SECTION_OPTIONS_PROP}.overlayOpacity`, label: 'Overlay opacity', type: 'number', min: 0, max: 1, designGroup: 'appearance', group: 'appearance' },
  select('radius', 'Corner radius', ['none', 'sm', 'md', 'lg', 'xl', 'full'], 'appearance'),
  select('cardStyle', 'Card style', ['flat', 'outlined', 'elevated', 'glass'], 'appearance'),
  select('theme', 'Theme', ['inherit', 'light', 'dark'], 'appearance'),
  select('animation', 'Animation', ['none', 'fade', 'slide', 'zoom'], 'appearance'),
  select('visibility', 'Visible on', ['all', 'desktop', 'mobile'], 'layout'),
]
