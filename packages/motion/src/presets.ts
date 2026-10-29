/**
 * Animation presets, tokens and the shared settings schema. Pure: no DOM, so
 * they are unit tested and safe on the server. The runtime
 * (`animations.client.tsx`) and the CSS (`animations.css`) read the same
 * names from `data-animate`.
 *
 * Store sites use these names too (`packages/store-sections`, Theme ›
 * Animations and each section's Animation setting); their CSS lives in
 * `elements/motion.ts`.
 */
import { z } from "zod";

/** What a `data-animate` element can play. Directions are logical: `slide-start` comes from the reading start (the right in Arabic). */
export const ANIMATION_PRESETS = ["fade", "fade-up", "slide-start", "slide-end", "zoom-in", "stagger"] as const;
export type AnimationPreset = (typeof ANIMATION_PRESETS)[number];

/** A section's Animation setting: `inherit` takes the site default, `none` turns it off. */
export const animationPresetSchema = z.enum(["inherit", "none", ...ANIMATION_PRESETS]);
export type AnimationSetting = z.output<typeof animationPresetSchema>;

/**
 * The site default. `auto` keeps each element's own reveal (headings rise,
 * photos zoom, grids stagger): what every store had before this setting, so
 * it is the default and existing sites look the same without being re-saved.
 */
export const animationDefaultSchema = z.enum(["auto", ...ANIMATION_PRESETS]);
export type AnimationDefault = z.output<typeof animationDefaultSchema>;

export const ANIMATION_SPEEDS = ["slow", "normal", "fast"] as const;
export const animationSpeedSchema = z.enum(ANIMATION_SPEEDS);
export type AnimationSpeed = z.output<typeof animationSpeedSchema>;

/** Site-level animation settings: the master switch, the default preset and the speed. */
export const siteAnimationSchema = z.object({
  animationsEnabled: z.boolean().default(true),
  animationDefault: animationDefaultSchema.default("auto"),
  animationSpeed: animationSpeedSchema.default("normal"),
});
export type SiteAnimation = z.output<typeof siteAnimationSchema>;

/** Old names still accepted from markup and saved data: `scale-in` and `fade-in` came from the first pilot. */
const ALIASES: Record<string, AnimationPreset> = { "scale-in": "zoom-in", "fade-in": "fade" };

/** A section setting from saved data: a known value, an alias, or `inherit` for anything else (missing, junk). */
export function parseAnimationSetting(raw: unknown): AnimationSetting {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (v in ALIASES) return ALIASES[v]!;
  const parsed = animationPresetSchema.safeParse(v);
  return parsed.success ? parsed.data : "inherit";
}

/**
 * What a section plays: `null` when the master switch is off or the section
 * says `none`, the site default for `inherit`, else its own preset.
 */
export function resolveAnimation(
  section: AnimationSetting | null | undefined,
  site: { animationsEnabled?: boolean; animationDefault?: AnimationDefault } | null | undefined,
): AnimationDefault | null {
  if (site?.animationsEnabled === false) return null;
  const setting = section ?? "inherit";
  if (setting === "none") return null;
  if (setting === "inherit") return site?.animationDefault ?? "auto";
  return setting;
}

/** How much longer (or shorter) every animation runs at each speed. */
export const SPEED_FACTOR: Record<AnimationSpeed, number> = { slow: 1.6, normal: 1, fast: 0.6 };

/** Very simple, quick motion (owner, 2026-10-29): a short fade-up, no bounce. Mirrored as CSS tokens in `animations.css`. */
export const MOTION = {
  /** Travel of a rise or slide, in px. */
  distance: 16,
  /** In ms. */
  duration: 500,
  /** Gap between items of a stagger group, in ms. */
  stagger: 80,
  /** Stagger items after this many play together, so a long grid doesn't trail. */
  maxOrder: 8,
  ease: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
  /** Count-up length, in ms. */
  countUp: 1000,
} as const;

/** A `data-animate` value from markup, or `null` when it names no preset (`none`, typos). */
export function normalizePreset(raw: string | null | undefined): AnimationPreset | null {
  if (raw == null) return null;
  const v = raw.trim().toLowerCase();
  if (v === "" || v === "auto") return "fade-up";
  if (v in ALIASES) return ALIASES[v]!;
  return (ANIMATION_PRESETS as readonly string[]).includes(v) ? (v as AnimationPreset) : null;
}

/** A finite number from an attribute, else the fallback; clamped when bounds are given. */
export function parseNumber(raw: string | null | undefined, fallback: number, min = -Infinity, max = Infinity): number {
  const n = raw == null || raw.trim() === "" ? NaN : Number(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** An ease-out curve for count-ups: fast start, gentle settle. `t` in 0…1. */
export function easeOutQuad(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return 1 - (1 - c) * (1 - c);
}

/**
 * The number a count-up ends on, read from its rendered text ("5", "1,080",
 * "٣٩"), with how to write it back. `null` when the text holds no number.
 */
export function parseCount(text: string): { value: number; arabicDigits: boolean; grouped: boolean } | null {
  const arabicDigits = /[٠-٩]/.test(text);
  const western = text.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/٬/g, ",");
  const match = western.match(/\d[\d,]*/);
  if (!match) return null;
  const value = Number(match[0].replace(/,/g, ""));
  return Number.isFinite(value) ? { value, arabicDigits, grouped: match[0].includes(",") } : null;
}

/** Writes a count back in the digits and grouping it was rendered with. */
export function formatCount(value: number, { arabicDigits, grouped }: { arabicDigits: boolean; grouped: boolean }): string {
  const n = Math.round(value);
  const s = grouped ? n.toLocaleString("en-US") : String(n);
  return arabicDigits ? s.replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d))).replace(/,/g, "٬") : s;
}
