/**
 * The template → product card style map (`card-styles.ts`): every niche
 * template has a style, no style covers much more than a third of them,
 * neighbours in an industry differ, and every styled product section still
 * stores as a library ref.
 */
import { describe, expect, it } from "vitest";
import { CARD_STYLE_IDS } from "../designs/products/card-styles";
import { hasProductList } from "../designs/products/card-styles";
import { treeBuilder } from "../designs/builder";
import { CODE_TEMPLATES } from "./catalog";
import { CLASSIC_KEY } from "./classic";
import { TEMPLATE_CARD_STYLES } from "./card-styles";
import { designRef } from "./ref-config";

const NICHE = CODE_TEMPLATES.filter((t) => t.key !== CLASSIC_KEY);

describe("template card styles", () => {
  it("every template but Tallaby Classic has a style, and the map names no other key", () => {
    expect(NICHE.filter((t) => !TEMPLATE_CARD_STYLES[t.key]).map((t) => t.key)).toEqual([]);
    expect(TEMPLATE_CARD_STYLES[CLASSIC_KEY]).toBeUndefined();
    const keys = new Set(CODE_TEMPLATES.map((t) => t.key));
    expect(Object.keys(TEMPLATE_CARD_STYLES).filter((key) => !keys.has(key))).toEqual([]);
  });

  it("no style is used by more than 35% of the templates, and every style is used", () => {
    const counts = new Map<string, number>();
    for (const t of NICHE) counts.set(TEMPLATE_CARD_STYLES[t.key]!, (counts.get(TEMPLATE_CARD_STYLES[t.key]!) ?? 0) + 1);
    for (const style of CARD_STYLE_IDS) expect(counts.get(style) ?? 0, style).toBeGreaterThan(0);
    for (const [style, n] of counts) expect(n / NICHE.length, style).toBeLessThanOrEqual(0.35);
  });

  it("templates next to each other in an industry's gallery have different styles", () => {
    const byIndustry = new Map<string, typeof NICHE>();
    for (const t of NICHE) byIndustry.set(t.category, [...(byIndustry.get(t.category) ?? []), t]);
    const clashes: string[] = [];
    for (const list of byIndustry.values()) {
      const sorted = [...list].sort((a, b) => a.sortOrder - b.sortOrder);
      sorted.slice(1).forEach((t, i) => {
        if (TEMPLATE_CARD_STYLES[t.key] === TEMPLATE_CARD_STYLES[sorted[i]!.key]) clashes.push(`${sorted[i]!.key} / ${t.key}`);
      });
    }
    expect(clashes).toEqual([]);
  });

  it("every styled product section of a template still converts to a library ref", () => {
    const misses: string[] = [];
    let checked = 0;
    for (const t of NICHE) {
      for (const design of t.designs) {
        if (!design.libraryRef || design.category === "hero" || !hasProductList(design.tree(treeBuilder))) continue;
        checked += 1;
        if (!designRef(design, t.category)) misses.push(`${t.key}: ${design.id}`);
      }
    }
    expect(checked).toBeGreaterThan(NICHE.length);
    expect(misses).toEqual([]);
  });
});
