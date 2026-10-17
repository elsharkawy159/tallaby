/**
 * Design system → CSS custom properties for a store site (PLAN.md P4-02,
 * P4-13). Section components style themselves with the Tallaby Classic
 * tokens (`--sf-*`, apps/ecommerce storefront.module.css), so a store with no
 * design system looks exactly like Classic, and a design system only
 * re-points those tokens. Values come from the validated schema (colors and
 * numbers only), so the CSS cannot carry anything else.
 */
import type { DesignSystem } from "../config/schema";

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

export function designSystemToTokens(ds: Pick<DesignSystem, "colors" | "spacing"> | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!ds) return out;
  for (const [key, tokens] of Object.entries(COLOR_TOKENS) as [keyof DesignSystem["colors"], string[]][]) {
    const value = ds.colors?.[key];
    if (value) for (const token of tokens) out[token] = value;
  }
  const radius = ds.spacing?.borderRadius;
  if (typeof radius === "number") out["--sf-radius"] = `${radius}px`;
  const width = ds.spacing?.containerMaxWidth;
  if (typeof width === "number") out["--sf-max-width"] = `${width}px`;
  const padding = ds.spacing?.sectionPaddingY;
  if (typeof padding === "number") out["--sf-section-y"] = `${padding}px`;
  return out;
}

/** A `<style>` body scoping the tokens to the site root; empty when nothing is set. */
export function designSystemToCss(ds: Pick<DesignSystem, "colors" | "spacing"> | null | undefined, scope = `.${SITE_ROOT_CLASS}`): string {
  const tokens = designSystemToTokens(ds);
  const decl = Object.entries(tokens)
    // Defence in depth: the schema already restricts these to colors/numbers.
    .filter(([, value]) => !/[;{}<>]/.test(value))
    .map(([key, value]) => `${key}: ${value};`)
    .join(" ");
  return decl ? `${scope} { ${decl} }` : "";
}
