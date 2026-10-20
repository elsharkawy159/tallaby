/**
 * Design system → CSS custom properties for a store site (PLAN.md P4-02,
 * P4-13). Section components style themselves with the Tallaby Classic
 * tokens (`--sf-*`, apps/ecommerce storefront.module.css), so a store with no
 * design system looks exactly like Classic, and a design system only
 * re-points those tokens. Values come from the validated schema (colors and
 * numbers only), so the CSS cannot carry anything else.
 */
import type { DesignSystem } from "../config/schema";
import { storeFontFamily } from "./fonts";

/** Class on the site root; the theme CSS is scoped to it. */
export const SITE_ROOT_CLASS = "sf-site";

/**
 * Tallaby Classic defaults (apps/ecommerce storefront.module.css `.tokens`),
 * for hosts that render sections outside the storefront (the editor canvas).
 */
export const CLASSIC_TOKENS: Readonly<Record<string, string>> = {
  "--sf-paper": "#ffffff",
  "--sf-shelf": "#f2f5f4",
  "--sf-line": "#e2e8e7",
  "--sf-ink": "#10242b",
  "--sf-muted": "#5c6d72",
  "--sf-brand": "#145163",
  "--sf-brand-ink": "#ffffff",
  "--sf-sun": "#fdad28",
};

const COLOR_TOKENS: Record<keyof DesignSystem["colors"], string[]> = {
  primary: ["--sf-brand", "--primary"],
  secondary: ["--sf-shelf"],
  background: ["--sf-paper", "--background"],
  foreground: ["--sf-ink", "--foreground"],
  muted: ["--sf-muted", "--muted-foreground"],
  border: ["--sf-line", "--border"],
  accent: ["--sf-sun"],
  destructive: ["--destructive"],
};

/** True for a light `#rgb` / `#rrggbb` color (YIQ brightness), null when it is not a hex color. */
export function isLightHex(value: string): boolean | null {
  let hex = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/./g, (c) => c + c);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

export type ThemeInput = Pick<DesignSystem, "colors" | "spacing"> & { typography?: DesignSystem["typography"] };

export function designSystemToTokens(ds: ThemeInput | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!ds) return out;
  for (const [key, tokens] of Object.entries(COLOR_TOKENS) as [keyof DesignSystem["colors"], string[]][]) {
    const value = ds.colors?.[key];
    if (value) for (const token of tokens) out[token] = value;
  }
  // Text on the brand color (buttons, announcement bar) stays readable on a light brand.
  const light = ds.colors?.primary ? isLightHex(ds.colors.primary) : null;
  if (light !== null) {
    const ink = light ? CLASSIC_TOKENS["--sf-ink"]! : "#ffffff";
    out["--sf-brand-ink"] = ink;
    out["--primary-foreground"] = ink;
  }
  // Only fonts the storefront loads (core/fonts.ts); any other name is ignored.
  const body = storeFontFamily(ds.typography?.bodyFont);
  if (body) out["--sf-font-body"] = body;
  const heading = storeFontFamily(ds.typography?.headingFont);
  if (heading) out["--sf-font-heading"] = heading;
  const radius = ds.spacing?.borderRadius;
  if (typeof radius === "number") out["--sf-radius"] = `${radius}px`;
  const width = ds.spacing?.containerMaxWidth;
  if (typeof width === "number") out["--sf-max-width"] = `${width}px`;
  const padding = ds.spacing?.sectionPaddingY;
  if (typeof padding === "number") out["--sf-section-y"] = `${padding}px`;
  return out;
}

/** A `<style>` body scoping the tokens to the site root; empty when nothing is set. */
export function designSystemToCss(ds: ThemeInput | null | undefined, scope = `.${SITE_ROOT_CLASS}`): string {
  const tokens = designSystemToTokens(ds);
  const decl = Object.entries(tokens)
    // Defence in depth: the schema already restricts these to colors/numbers.
    .filter(([, value]) => !/[;{}<>]/.test(value))
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");
  return decl ? `${scope} { ${decl} }` : "";
}
