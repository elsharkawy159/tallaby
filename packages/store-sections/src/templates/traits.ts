/**
 * What the AI store builder needs to know about a template to suggest it
 * (spec 2026-11-08-ai-store-builder-v2-design.md §5): its style (hand-set on
 * each template), its tone (read from its background colour) and how many
 * product cards and category tiles its home page shows (read from the home
 * tree). Only `style` is written by hand; the rest is computed. No React here.
 */
import type { ComponentNode } from "../config/schema";
import { MAX_LIST_LIMIT, walkNodes } from "../elements/data";
import type { TemplateDefinition } from "./types";

export const TEMPLATE_STYLES = ["luxe", "bold", "warm", "minimal", "playful", "classic"] as const;
export type TemplateStyle = (typeof TEMPLATE_STYLES)[number];

export type TemplateTone = "light" | "dark";

export type TemplateNeeds = {
  /** Products the home's biggest product list shows (one page of a paginated grid). */
  productCards: number;
  /** Categories the home shows: the biggest category list, or the highest "Nth category" a product list asks for. */
  categoryTiles: number;
};

/** `#rgb` / `#rrggbb` to 0–255 channels, or null. (`core/palette.ts` has the full colour kit; this file keeps its own small one.) */
function rgbOf(value: string): [number, number, number] | null {
  let hex = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.replace(/./g, (c) => c + c);
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
}

/** WCAG relative luminance (0 black – 1 white), or null when the colour is not hex. */
export function colorLuminance(value: string): number | null {
  const rgb = rgbOf(value);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio of two hex colours (1–21), or null. */
export function colorContrastRatio(a: string, b: string): number | null {
  const la = colorLuminance(a);
  const lb = colorLuminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Light or dark, from a background colour: the side it contrasts less with. Non-hex counts as light. */
export function toneOfColor(background: string): TemplateTone {
  const l = colorLuminance(background);
  if (l === null) return "light";
  // Contrast with black vs white: (l + 0.05) / 0.05 vs 1.05 / (l + 0.05); equal at l ≈ 0.179.
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? "light" : "dark";
}

const toneCache = new WeakMap<TemplateDefinition, TemplateTone>();
const needsCache = new WeakMap<TemplateDefinition, TemplateNeeds>();

/** The template's background colour (its design system's `background`). */
export function templateBackground(template: TemplateDefinition): string {
  return template.config().designSystem.colors.background ?? "#ffffff";
}

/** Light or dark, from the template's background colour. Cached per template. */
export function templateTone(template: TemplateDefinition): TemplateTone {
  let tone = toneCache.get(template);
  if (!tone) {
    tone = toneOfColor(templateBackground(template));
    toneCache.set(template, tone);
  }
  return tone;
}

const num = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? Math.min(MAX_LIST_LIMIT, Math.max(1, Math.round(value))) : fallback;

/** Product cards and category tiles a tree draws (the same defaults as `nodeCatalogQuery`). */
export function treeNeeds(nodes: readonly ComponentNode[] | undefined): TemplateNeeds {
  const needs: TemplateNeeds = { productCards: 0, categoryTiles: 0 };
  walkNodes(nodes, (node) => {
    const props = node.props ?? {};
    if (node.type === "productList") {
      // A "selected products" list shows only the seller's picks; it asks for no more than it names.
      const picked = Array.isArray(props.productIds) ? props.productIds.length : 0;
      const limit = props.source === "selected" ? Math.min(num(props.limit, 8), Math.max(1, picked)) : num(props.limit, 8);
      needs.productCards = Math.max(needs.productCards, limit);
      if (props.source === "category" && typeof props.categoryIndex === "number" && Number.isInteger(props.categoryIndex)) {
        needs.categoryTiles = Math.max(needs.categoryTiles, Math.min(8, Math.max(1, props.categoryIndex)));
      }
    } else if (node.type === "categoryList") {
      const picked = Array.isArray(props.categoryIds) ? props.categoryIds.length : 0;
      needs.categoryTiles = Math.max(needs.categoryTiles, picked || num(props.limit, 8));
    }
  });
  return needs;
}

/** What the template's home page shows, read from its home tree. Cached per template. */
export function templateNeeds(template: TemplateDefinition): TemplateNeeds {
  let needs = needsCache.get(template);
  if (!needs) {
    const config = template.config();
    const home = config.pages.find((page) => page.isHome) ?? config.pages[0];
    const totals: TemplateNeeds = { productCards: 0, categoryTiles: 0 };
    for (const instance of home?.content.sections ?? []) {
      const one = treeNeeds(instance.componentTree);
      totals.productCards = Math.max(totals.productCards, one.productCards);
      totals.categoryTiles = Math.max(totals.categoryTiles, one.categoryTiles);
    }
    needs = totals;
    needsCache.set(template, needs);
  }
  return needs;
}

/** The suggestion traits of a template, in one plain object. */
export type TemplateTraits = {
  key: string;
  category: string;
  style: readonly TemplateStyle[];
  tone: TemplateTone;
  /** The template's background colour (what a seller's primary colour sits on). */
  background: string;
  needs: TemplateNeeds;
};

const traitsCache = new WeakMap<TemplateDefinition, TemplateTraits>();

/** Cached per template (building a template's config is not free). */
export function templateTraits(template: TemplateDefinition): TemplateTraits {
  let traits = traitsCache.get(template);
  if (!traits) {
    traits = { key: template.key, category: template.category, style: template.style, tone: templateTone(template), background: templateBackground(template), needs: templateNeeds(template) };
    traitsCache.set(template, traits);
  }
  return traits;
}
