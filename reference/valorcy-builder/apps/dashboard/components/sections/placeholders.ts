/**
 * Placeholder image system.
 *
 * Every section that renders media falls back to one of these local assets when
 * no image is set. They replace the ~199 hardcoded `unsplash.com` / `pravatar.cc`
 * URLs that used to live in `defaultProps` — those were external, unoptimizable,
 * legally murky, and made a freshly-inserted section look "finished" when it was
 * actually unconfigured.
 *
 * Requirements these satisfy:
 *   • local (no external host, no layout shift from a slow CDN)
 *   • responsive (SVG, scales to any slot without a second request)
 *   • theme-aware (neutral palette + `currentColor`-ish greys that read on both)
 *   • clearly a placeholder (so users know to replace it)
 *   • AI-replaceable (lib/ai/image-search.ts targets the same prop keys, so it
 *     swaps these for real images with no extra wiring)
 */

export const PLACEHOLDER_KINDS = [
  'landscape',
  'portrait',
  'square',
  'wide',
  'avatar',
  'logo',
  'screenshot',
  'product',
] as const

export type PlaceholderKind = (typeof PLACEHOLDER_KINDS)[number]

const BASE = '/builder-sections/placeholders'

const PLACEHOLDER_SRC: Record<PlaceholderKind, string> = {
  landscape: `${BASE}/landscape.svg`,
  portrait: `${BASE}/portrait.svg`,
  square: `${BASE}/square.svg`,
  wide: `${BASE}/wide.svg`,
  avatar: `${BASE}/avatar.svg`,
  logo: `${BASE}/logo.svg`,
  screenshot: `${BASE}/screenshot.svg`,
  product: `${BASE}/product.svg`,
}

/** Intrinsic dimensions, so non-fill callers can size without a layout shift. */
export const PLACEHOLDER_DIMENSIONS: Record<
  PlaceholderKind,
  { width: number; height: number }
> = {
  landscape: { width: 1200, height: 675 },
  portrait: { width: 900, height: 1200 },
  square: { width: 1000, height: 1000 },
  wide: { width: 1680, height: 720 },
  avatar: { width: 256, height: 256 },
  logo: { width: 320, height: 120 },
  screenshot: { width: 1440, height: 900 },
  product: { width: 1000, height: 1000 },
}

/** Media ratios (see MediaRatio in schema/section-schema.ts) → placeholder art. */
const RATIO_TO_KIND: Record<string, PlaceholderKind> = {
  square: 'square',
  video: 'landscape',
  portrait: 'portrait',
  wide: 'wide',
  auto: 'landscape',
}

/**
 * Resolves the placeholder asset for a slot. Pass an explicit `kind` when the
 * slot has semantic meaning (an avatar, a logo); otherwise the aspect ratio picks
 * a sensible default.
 */
export function placeholderFor (
  kind?: PlaceholderKind,
  ratio?: string
): string {
  if (kind) return PLACEHOLDER_SRC[kind]
  if (ratio && RATIO_TO_KIND[ratio]) return PLACEHOLDER_SRC[RATIO_TO_KIND[ratio]!]
  return PLACEHOLDER_SRC.landscape
}

/** True when `src` is one of our placeholders — i.e. the slot is still unset. */
export function isPlaceholderSrc (src: string | undefined | null): boolean {
  if (!src) return true
  return src.startsWith(BASE)
}

/**
 * Resolves a slot's effective source. Returns the placeholder when the user (or
 * the AI) has not supplied a real image yet.
 */
export function resolveMediaSrc (
  src: string | undefined | null,
  kind?: PlaceholderKind,
  ratio?: string
): string {
  const trimmed = typeof src === 'string' ? src.trim() : ''
  return trimmed !== '' ? trimmed : placeholderFor(kind, ratio)
}
