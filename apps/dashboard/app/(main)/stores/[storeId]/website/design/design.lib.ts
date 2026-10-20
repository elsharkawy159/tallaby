/**
 * Website › Design system choices (PLAN.md P4-13). Pure data and helpers; the
 * stored shape is `designSystemSchema` (@workspace/store-sections), which the
 * server validates again on save. Adapted from the reference
 * `components/design/palette-presets.tsx`.
 */
import type { DesignSystem } from "@workspace/store-sections";
import { FONT_PAIRINGS, findFontPairing, type FontPairing } from "@workspace/store-sections/fonts";

import { COLOR_FIELDS, type ColorKey } from "@workspace/store-editor/lib/design-fields.lib";

export { COLOR_FIELDS, type ColorKey };

/** Brand colors a preset sets. `secondary` is the light panel color (`--sf-shelf`). */
export const PALETTE_PRESETS: readonly { id: string; colors: Partial<Record<"primary" | "secondary" | "accent", string>> }[] = [
  { id: "classic", colors: {} },
  { id: "ocean", colors: { primary: "#0b5cad", secondary: "#eef4fb", accent: "#00a6c8" } },
  { id: "forest", colors: { primary: "#2d6a4f", secondary: "#eef5f0", accent: "#e9b949" } },
  { id: "sunset", colors: { primary: "#c2410c", secondary: "#fff4ec", accent: "#f59e0b" } },
  { id: "berry", colors: { primary: "#7b2d8b", secondary: "#f6eef8", accent: "#ec4899" } },
  { id: "midnight", colors: { primary: "#1f2937", secondary: "#f3f4f6", accent: "#e94560" } },
  { id: "rose", colors: { primary: "#be185d", secondary: "#fdf2f8", accent: "#f59e0b" } },
  { id: "sand", colors: { primary: "#7c5c3b", secondary: "#f7f1ea", accent: "#c08a3e" } },
];

/**
 * Complete looks for the editor's Brand tab (P4B-14, like the reference
 * `DESIGN_SYSTEM_PRESETS`): a palette above, a font pairing and a corner
 * radius. `classic` clears all three back to Tallaby Classic. Names reuse
 * `websiteDesign.colors.preset.*`.
 */
export const THEME_PRESETS: readonly { id: string; pairing: string; radius?: number }[] = [
  { id: "classic", pairing: "classic" },
  { id: "ocean", pairing: "cairo", radius: 8 },
  { id: "forest", pairing: "tajawal", radius: 12 },
  { id: "sunset", pairing: "messiri", radius: 16 },
  { id: "berry", pairing: "kufi", radius: 24 },
  { id: "midnight", pairing: "almarai", radius: 4 },
  { id: "rose", pairing: "messiri", radius: 24 },
  { id: "sand", pairing: "kufi", radius: 8 },
];

export const RADIUS_OPTIONS = [0, 4, 8, 12, 16, 24] as const;
export const WIDTH_OPTIONS = [
  { id: "narrow", value: 1024 },
  { id: "standard", value: undefined },
  { id: "wide", value: 1440 },
] as const;
export const SPACING_OPTIONS = [
  { id: "compact", value: 32 },
  { id: "standard", value: undefined },
  { id: "airy", value: 96 },
] as const;

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
export const isHexColor = (value: string) => HEX.test(value.trim());

/** The preset whose brand colors equal the design system's, if any. */
export function matchPreset(colors: DesignSystem["colors"]): string | null {
  const preset = PALETTE_PRESETS.find((p) =>
    (["primary", "secondary", "accent"] as const).every((key) => (p.colors[key] ?? undefined) === (colors[key] ?? undefined)),
  );
  return preset?.id ?? null;
}

export function applyPreset(colors: DesignSystem["colors"], presetId: string): DesignSystem["colors"] {
  const preset = PALETTE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return colors;
  const { primary: _p, secondary: _s, accent: _a, ...rest } = colors;
  return { ...rest, ...preset.colors };
}

/** Sets heading + body fonts from a pairing (`classic` = no fonts set). */
export function applyPairing(typography: DesignSystem["typography"], pairing: FontPairing | undefined): DesignSystem["typography"] {
  const { headingFont: _h, bodyFont: _b, ...rest } = typography;
  return !pairing || pairing.id === "classic" ? rest : { ...rest, headingFont: pairing.heading, bodyFont: pairing.body };
}

/** A whole theme preset: palette, fonts and radius; other tokens the seller set are kept. */
export function applyThemePreset(ds: DesignSystem, presetId: string): DesignSystem {
  const theme = THEME_PRESETS.find((p) => p.id === presetId);
  if (!theme) return ds;
  const { borderRadius: _r, ...spacing } = ds.spacing;
  return {
    colors: applyPreset(ds.colors, theme.id),
    typography: applyPairing(ds.typography, FONT_PAIRINGS.find((p) => p.id === theme.pairing)),
    spacing: theme.radius === undefined ? spacing : { ...spacing, borderRadius: theme.radius },
  };
}

/** The theme preset the design system matches exactly (palette, fonts and radius), if any. */
export function matchThemePreset(ds: DesignSystem): string | null {
  const palette = matchPreset(ds.colors);
  const pairing = findFontPairing(ds.typography);
  const theme = THEME_PRESETS.find((p) => p.id === palette && p.pairing === pairing.id && p.radius === ds.spacing.borderRadius);
  return theme?.id ?? null;
}

/** Sets or clears (empty value = back to Classic) one token in a section of the design system. */
export function setToken<S extends "colors" | "typography" | "spacing">(
  ds: DesignSystem,
  section: S,
  key: keyof DesignSystem[S],
  value: DesignSystem[S][keyof DesignSystem[S]] | undefined,
): DesignSystem {
  const next = { ...ds[section] } as Record<string, unknown>;
  if (value === undefined || value === "") delete next[key as string];
  else next[key as string] = value;
  return { ...ds, [section]: next };
}
