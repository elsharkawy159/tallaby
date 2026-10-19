/**
 * Store fonts (PLAN.md P4-13). A design system may only name a font the
 * storefront actually loads: each entry here is loaded with next/font in
 * apps/ecommerce (`storefront-font.ts`) under the CSS variable `cssVar`, and
 * the dashboard preview loads the same set. Every font covers Arabic and
 * Latin, so one pairing works for both store languages. No React here.
 */

export type StoreFont = {
  /** The name stored in `designSystem.typography` (also the Google Fonts family). */
  name: string;
  /** CSS variable next/font defines for it. */
  cssVar: string;
};

export const STORE_FONTS = [
  // Tallaby Classic's typeface; `--font-storefront` is the storefront default.
  { name: "Readex Pro", cssVar: "--font-storefront" },
  { name: "Cairo", cssVar: "--font-sf-cairo" },
  { name: "Tajawal", cssVar: "--font-sf-tajawal" },
  { name: "Almarai", cssVar: "--font-sf-almarai" },
  { name: "IBM Plex Sans Arabic", cssVar: "--font-sf-plex-arabic" },
  { name: "Noto Kufi Arabic", cssVar: "--font-sf-noto-kufi" },
  { name: "El Messiri", cssVar: "--font-sf-el-messiri" },
  // Naskh serif with Latin glyphs: the editorial display face (Atelier template).
  { name: "Amiri", cssVar: "--font-sf-amiri" },
] as const satisfies readonly StoreFont[];

export type StoreFontName = (typeof STORE_FONTS)[number]["name"];

export type FontPairing = { id: string; heading: StoreFontName; body: StoreFontName };

/** Heading + body pairings offered on Website › Design system. `classic` = no typography set. */
export const FONT_PAIRINGS: readonly FontPairing[] = [
  { id: "classic", heading: "Readex Pro", body: "Readex Pro" },
  { id: "cairo", heading: "Cairo", body: "Cairo" },
  { id: "tajawal", heading: "Tajawal", body: "Tajawal" },
  { id: "kufi", heading: "Noto Kufi Arabic", body: "IBM Plex Sans Arabic" },
  { id: "messiri", heading: "El Messiri", body: "Cairo" },
  { id: "almarai", heading: "Almarai", body: "Tajawal" },
  { id: "amiri", heading: "Amiri", body: "Noto Kufi Arabic" },
];

const BY_NAME = new Map<string, StoreFont>(STORE_FONTS.map((font) => [font.name, font]));

/** The CSS `font-family` value for a stored font name, or null when the storefront does not load it. */
export function storeFontFamily(name: string | null | undefined): string | null {
  const font = name ? BY_NAME.get(name) : undefined;
  return font ? `var(${font.cssVar}), system-ui, sans-serif` : null;
}

/** The pairing a typography object matches (falls back to `classic`). */
export function findFontPairing(typography: { headingFont?: string; bodyFont?: string } | null | undefined): FontPairing {
  const heading = typography?.headingFont ?? "Readex Pro";
  const body = typography?.bodyFont ?? "Readex Pro";
  return FONT_PAIRINGS.find((p) => p.heading === heading && p.body === body) ?? FONT_PAIRINGS[0]!;
}
