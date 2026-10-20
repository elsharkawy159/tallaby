import type { CSSProperties } from 'react'

import type { DesignSystem } from '@/lib/builder/store'

/**
 * Per-preset look for the shared chrome renderer.
 *
 * Every shipped `navbar-*` / `footer-*` id keeps its own visual identity here —
 * the classes and surface treatments are ported from the section files those ids
 * used to render directly, so existing sites look the same after moving to the
 * config-driven renderer. Behaviour (navigation, components, mobile) is shared;
 * only the styling differs per preset.
 */

export interface NavbarPreset {
  /** Extra classes on the <header>. */
  headerClass?: string
  /** Surface treatment layered under the user's own section style. */
  surface?: (ds: DesignSystem['colors']) => CSSProperties
  /** The bar row inside the container. */
  barClass: string
  /** Where the navigation sits. */
  navPlacement: 'center-absolute' | 'inline' | 'inline-grow'
  navClass?: string
  linkClass: string
  /** Wraps the whole bar in a floating pill (navbar-pill). */
  pill?: boolean
  pillClass?: string
  pillSurface?: (ds: DesignSystem['colors']) => CSSProperties
  /** Vertical divider after the logo. */
  logoDivider?: boolean
  logoSize?: number
  /** Sticky by default regardless of the model's `behavior.sticky`. */
  alwaysSticky?: boolean
  ctaClass?: string
  secondaryClass?: string
}

const CENTERED_NAV =
  'absolute start-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex'

const MUTED_LINK =
  'relative rounded-md px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground'

export const NAVBAR_PRESETS: Record<string, NavbarPreset> = {
  'navbar-simple': {
    headerClass: 'relative w-full',
    surface: (c) => ({
      backgroundColor: `color-mix(in oklch, ${c.background} 70%, transparent)`,
      backdropFilter: 'blur(14px) saturate(140%)',
      WebkitBackdropFilter: 'blur(14px) saturate(140%)',
      borderBottom: `1px solid color-mix(in oklch, ${c.border} 60%, transparent)`,
    }),
    barClass: 'relative flex h-16 max-w-[1280px] items-center justify-between',
    navPlacement: 'center-absolute',
    navClass: CENTERED_NAV,
    linkClass: MUTED_LINK,
  },

  'navbar-sticky': {
    headerClass: 'sticky top-0 z-50 w-full',
    alwaysSticky: true,
    surface: (c) => ({
      backgroundColor: `color-mix(in oklch, ${c.background} 75%, transparent)`,
      backdropFilter: 'blur(16px) saturate(160%)',
      WebkitBackdropFilter: 'blur(16px) saturate(160%)',
      borderBottom: `1px solid color-mix(in oklch, ${c.border} 50%, transparent)`,
    }),
    barClass: 'relative flex h-16 items-center justify-between',
    navPlacement: 'center-absolute',
    navClass: CENTERED_NAV,
    linkClass: MUTED_LINK,
  },

  'navbar-transparent': {
    headerClass: 'relative w-full',
    barClass: 'relative flex h-16 items-center justify-between',
    navPlacement: 'center-absolute',
    navClass: CENTERED_NAV,
    linkClass:
      'rounded-md px-3.5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground',
    ctaClass:
      'inline-flex h-9 items-center gap-1.5 rounded-md border border-foreground/20 px-4 text-sm font-medium text-foreground transition-all hover:border-foreground/50 hover:bg-foreground/5',
  },

  'navbar-mega': {
    headerClass: 'relative w-full',
    surface: (c) => ({
      backgroundColor: c.background,
      borderBottom: `1px solid ${c.border}`,
    }),
    barClass: 'flex h-[68px] items-center gap-8',
    navPlacement: 'inline-grow',
    navClass: 'hidden flex-1 items-center gap-0.5 md:flex',
    linkClass:
      'inline-flex items-center gap-1 rounded-md px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
    logoDivider: true,
  },

  'navbar-app': {
    headerClass: 'relative w-full border-b',
    surface: (c) => ({ backgroundColor: c.background, borderColor: c.border }),
    barClass: 'flex h-[68px] items-center gap-8',
    navPlacement: 'inline-grow',
    navClass: 'hidden flex-1 items-center justify-center gap-0.5 md:flex',
    linkClass:
      'rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
    logoDivider: true,
  },

  'navbar-pill': {
    headerClass: 'relative w-full pt-4',
    barClass: 'flex w-full items-center gap-1',
    pill: true,
    pillClass: 'w-full items-center gap-1 rounded-full px-4 py-1.5',
    pillSurface: (c) => ({
      background: `color-mix(in oklch, ${c.background} 60%, transparent)`,
      backdropFilter: 'blur(18px) saturate(160%)',
      WebkitBackdropFilter: 'blur(18px) saturate(160%)',
      border: `1px solid color-mix(in oklch, ${c.border} 70%, transparent)`,
      boxShadow: `0 1px 0 inset color-mix(in oklch, white 60%, transparent), 0 20px 50px -16px color-mix(in oklch, ${c.primary} 22%, transparent), 0 6px 16px -8px rgb(0 0 0 / 0.10)`,
    }),
    navPlacement: 'inline',
    navClass: 'hidden items-center gap-1 md:flex',
    linkClass:
      'rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground',
    logoDivider: true,
    logoSize: 26,
  },
}

export const DEFAULT_NAVBAR_PRESET: NavbarPreset = NAVBAR_PRESETS['navbar-simple']!

export function navbarPreset (sectionId: string): NavbarPreset {
  return NAVBAR_PRESETS[sectionId] ?? DEFAULT_NAVBAR_PRESET
}

// ── Footer ─────────────────────────────────────────────────────────────────

export interface FooterPreset {
  footerClass?: string
  surface?: (ds: DesignSystem['colors']) => CSSProperties
  /** Brand + columns grid, or a single centred/split row. */
  layout: 'columns' | 'stacked' | 'row'
  /** Column count for the `columns` layout at md+. */
  columns?: number
  linkClass: string
  headingClass?: string
  /** Renders the whole footer on a dark surface (footer-dark). */
  dark?: boolean
}

const FOOTER_LINK =
  'text-sm text-muted-foreground transition-colors hover:text-foreground'

export const FOOTER_PRESETS: Record<string, FooterPreset> = {
  'footer-simple': {
    footerClass: 'relative border-t border-border/60 bg-background',
    layout: 'row',
    linkClass: FOOTER_LINK,
  },
  'footer-minimal': {
    footerClass: 'relative border-t border-border/60 bg-background',
    layout: 'stacked',
    linkClass: FOOTER_LINK,
  },
  'footer-brand': {
    footerClass: 'relative border-t border-border/60 bg-background',
    layout: 'stacked',
    linkClass: FOOTER_LINK,
  },
  'footer-columns': {
    footerClass: 'relative border-t border-border/60 bg-background',
    layout: 'columns',
    columns: 4,
    linkClass: FOOTER_LINK,
  },
  'footer-mega': {
    footerClass: 'relative border-t border-border/60 bg-background',
    layout: 'columns',
    columns: 4,
    linkClass: FOOTER_LINK,
  },
  'footer-dark': {
    footerClass: 'relative border-t border-white/10',
    surface: () => ({ backgroundColor: 'oklch(0.17 0.01 260)', color: 'white' }),
    layout: 'columns',
    columns: 3,
    dark: true,
    linkClass: 'text-sm text-white/60 transition-colors hover:text-white',
  },
  'footer-split': {
    footerClass: 'relative border-t border-border/60 bg-background',
    layout: 'row',
    linkClass: FOOTER_LINK,
  },
  'footer-legal': {
    footerClass: 'relative border-t border-border/60 bg-background',
    layout: 'row',
    linkClass: FOOTER_LINK,
  },
}

export const DEFAULT_FOOTER_PRESET: FooterPreset = FOOTER_PRESETS['footer-simple']!

export function footerPreset (sectionId: string): FooterPreset {
  return FOOTER_PRESETS[sectionId] ?? DEFAULT_FOOTER_PRESET
}
