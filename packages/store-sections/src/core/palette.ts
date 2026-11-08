/**
 * Seller colour → store palette (AI Store Builder v2, spec
 * 2026-11-08-ai-store-builder-v2-design.md §6.1). Pure, dependency-free and
 * deterministic: the same primary and template colours always give the same
 * palette.
 *
 * The template keeps its neutrals (background, foreground, muted, border)
 * and its destructive red; `primary` becomes the seller's colour and the two
 * brand-tinted keys (`secondary`, the soft shelf surface, and `accent`, the
 * highlight) are derived from it in OKLCH at the template's own lightness,
 * so a dark template stays dark. The schema has no separate "primary text"
 * key, so when the seller's colour fails WCAG AA as text on the background
 * (or under its own ink), `primary` itself is nudged in lightness, as little
 * as needed, and the result says so.
 */
import type { DesignSystem } from "../config/schema";

export type DesignSystemColors = DesignSystem["colors"];
export type Rgb = readonly [number, number, number];
/** OKLCH: lightness 0–1, chroma ≥ 0, hue in degrees 0–360. */
export type Oklch = { l: number; c: number; h: number };

export type PaletteNote = "primary_darkened_for_text" | "primary_lightened_for_text";
export type DerivedPalette = { colors: DesignSystemColors; adjusted: boolean; notes: PaletteNote[] };

/** WCAG AA for normal text. */
export const AA_TEXT_CONTRAST = 4.5;
/** Ink on a light brand (matches `designSystemToTokens`, Classic `--sf-ink`). */
const DARK_INK = "#10242b";
const LIGHT_INK = "#ffffff";
/** Template background assumed when it is unset or not a hex colour (Classic paper). */
const DEFAULT_BACKGROUND = "#ffffff";

// ---------------------------------------------------------------- hex / rgb

const HEX_RE = /^#?(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

/** `#abc` or `#aabbcc` (the leading `#` optional), case-insensitive. */
export function isValidHex(value: unknown): value is string {
  return typeof value === "string" && HEX_RE.test(value.trim());
}

/** `#ABC` → `#aabbcc`; null when it is not a 3- or 6-digit hex colour. */
export function normalizeHex(value: string): string | null {
  if (!isValidHex(value)) return null;
  let hex = value.trim().replace(/^#/, "").toLowerCase();
  if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c);
  return `#${hex}`;
}

export function hexToRgb(value: string): Rgb | null {
  const hex = normalizeHex(value);
  if (!hex) return null;
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb
    .map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0"))
    .join("")}`;
}

// ---------------------------------------------------------------- OKLab / OKLCH

const toLinear = (v: number) => {
  const s = v / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (v: number) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

/** sRGB 0–255 → OKLab (Björn Ottosson's matrices). */
export function rgbToOklab(rgb: Rgb): { l: number; a: number; b: number } {
  const [r, g, b] = rgb.map(toLinear) as [number, number, number];
  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/** OKLab → linear sRGB (may be outside 0–1 when out of gamut). */
function oklabToLinear(l: number, a: number, b: number): [number, number, number] {
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ];
}

export function rgbToOklch(rgb: Rgb): Oklch {
  const { l, a, b } = rgbToOklab(rgb);
  const c = Math.hypot(a, b);
  // Greys have no hue; 0 keeps the output deterministic.
  const h = c < 1e-4 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { l, c: c < 1e-4 ? 0 : c, h };
}

const inGamut = (lin: number[]) => lin.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** OKLCH → sRGB, reducing chroma (same lightness and hue) until it fits the sRGB gamut. */
export function oklchToRgb({ l, c, h }: Oklch): Rgb {
  const L = Math.min(1, Math.max(0, l));
  const rad = (h * Math.PI) / 180;
  const at = (chroma: number) => oklabToLinear(L, chroma * Math.cos(rad), chroma * Math.sin(rad));
  let lin = at(c);
  if (!inGamut(lin)) {
    let lo = 0;
    let hi = c;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(at(mid))) lo = mid;
      else hi = mid;
    }
    lin = at(lo);
  }
  return lin.map((v) => fromLinear(Math.min(1, Math.max(0, v)))) as unknown as Rgb;
}

export function hexToOklch(value: string): Oklch | null {
  const rgb = hexToRgb(value);
  return rgb ? rgbToOklch(rgb) : null;
}

export function oklchToHex(color: Oklch): string {
  return rgbToHex(oklchToRgb(color));
}

/** Euclidean distance in OKLab (ΔE OK; ~0.02 is barely visible). */
export function deltaEOk(a: Rgb, b: Rgb): number {
  const x = rgbToOklab(a);
  const y = rgbToOklab(b);
  return Math.hypot(x.l - y.l, x.a - y.a, x.b - y.b);
}

// ---------------------------------------------------------------- WCAG

/** WCAG 2.x relative luminance of a hex colour (0 when it is not one). */
export function relativeLuminance(value: string): number {
  const rgb = hexToRgb(value);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map(toLinear) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio, 1–21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Same YIQ rule as `isLightHex` in core/theme.ts (kept here so this module stays render-free). */
function isLight(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex)!;
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

/** The text colour the storefront puts on a brand fill (`--sf-brand-ink`). */
export function inkOnColor(value: string): string {
  return isValidHex(value) && isLight(normalizeHex(value)!) ? DARK_INK : LIGHT_INK;
}

// ---------------------------------------------------------------- palette

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function passesText(primary: string, background: string): boolean {
  return (
    contrastRatio(primary, background) >= AA_TEXT_CONTRAST &&
    contrastRatio(inkOnColor(primary), primary) >= AA_TEXT_CONTRAST
  );
}

/**
 * The smallest OKLCH lightness change (hue and chroma kept, chroma
 * gamut-mapped) that lets `primary` pass as text on `background` and under
 * its own ink. Tries both directions per step; on a tie it moves away from
 * the background. Null when no lightness passes (a mid-grey background).
 */
function nudgeForText(primary: string, background: string): { hex: string; darker: boolean } | null {
  const base = hexToOklch(primary)!;
  const bgLight = relativeLuminance(background) > 0.18;
  const order = bgLight ? [-1, 1] : [1, -1];
  for (let step = 1; step <= 200; step++) {
    for (const dir of order) {
      const l = base.l + dir * step * 0.005;
      if (l < 0 || l > 1) continue;
      const hex = oklchToHex({ ...base, l });
      if (passesText(hex, background)) return { hex, darker: dir < 0 };
    }
  }
  return null;
}

/**
 * Builds a store palette from the seller's colour and the template's colours.
 * Throws on an invalid `primary` (validate with `isValidHex` first).
 *
 * - `background`, `foreground`, `muted`, `border`, `destructive`: the base's, untouched.
 * - `primary`: the seller's colour, normalised; nudged in lightness only when
 *   it fails AA as text on the background or under its ink (`adjusted`).
 * - `secondary` (shelf surface): a faint primary tint at the base secondary's
 *   lightness (or just off the background's), so it stays a surface.
 * - `accent` (highlight): primary's hue at the base accent's lightness (or a
 *   step lighter/darker than primary), chroma from primary.
 */
export function derivePaletteFromPrimary(primary: string, base: DesignSystemColors): DerivedPalette {
  const seller = normalizeHex(primary);
  if (!seller) throw new Error("invalid_primary");
  const background = (base.background && normalizeHex(base.background)) || DEFAULT_BACKGROUND;
  const bg = hexToOklch(background)!;
  const darkBase = relativeLuminance(background) <= 0.18;

  const notes: PaletteNote[] = [];
  let brand = seller;
  if (!passesText(seller, background)) {
    const nudged = nudgeForText(seller, background);
    if (nudged && nudged.hex !== seller) {
      brand = nudged.hex;
      notes.push(nudged.darker ? "primary_darkened_for_text" : "primary_lightened_for_text");
    }
  }
  // Hue and chroma come from the seller's own colour, not the nudged one.
  const p = hexToOklch(seller)!;

  const baseSecondary = base.secondary ? hexToOklch(base.secondary) : null;
  const secondaryL = baseSecondary ? baseSecondary.l : clamp(darkBase ? bg.l + 0.05 : bg.l - 0.03, 0, 1);
  const secondary = oklchToHex({ l: secondaryL, c: Math.min(p.c * 0.25, 0.025), h: p.h });

  const baseAccent = base.accent ? hexToOklch(base.accent) : null;
  const accentL = baseAccent ? baseAccent.l : clamp(p.l > 0.6 ? p.l - 0.18 : p.l + 0.18, 0.05, 0.95);
  const accent = oklchToHex({ l: accentL, c: p.c, h: p.h });

  const colors: DesignSystemColors = { ...base, primary: brand, secondary, accent };
  return { colors, adjusted: notes.length > 0, notes };
}
