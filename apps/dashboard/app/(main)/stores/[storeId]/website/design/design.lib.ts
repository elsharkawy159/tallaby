/**
 * Website › Design system choices (PLAN.md P4-13). Pure data and helpers; the
 * stored shape is `designSystemSchema` (@workspace/store-sections), which the
 * server validates again on save. Adapted from the reference
 * `components/design/palette-presets.tsx`.
 */
import type { DesignSystem } from "@workspace/store-sections";

export type ColorKey = keyof DesignSystem["colors"];

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

/** Every color token the page edits, with the Tallaby Classic value shown when unset. */
export const COLOR_FIELDS: readonly { key: ColorKey; classic: string }[] = [
  { key: "primary", classic: "#145163" },
  { key: "accent", classic: "#fdad28" },
  { key: "secondary", classic: "#f2f5f4" },
  { key: "background", classic: "#ffffff" },
  { key: "foreground", classic: "#10242b" },
  { key: "muted", classic: "#5c6d72" },
  { key: "border", classic: "#e2e8e7" },
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
  { id: "airy", value: 72 },
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
