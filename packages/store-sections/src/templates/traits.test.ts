import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../config/schema";
import { CODE_TEMPLATES, getCodeTemplate } from "./catalog";
import { colorContrastRatio, colorLuminance, TEMPLATE_STYLES, templateNeeds, templateTone, templateTraits, toneOfColor, treeNeeds } from "./traits";

const node = (type: string, props: Record<string, unknown> = {}, children: ComponentNode[] = []): ComponentNode =>
  ({ id: `${type}-${Math.random().toString(36).slice(2, 8)}`, type, props, children }) as ComponentNode;

describe("template styles", () => {
  it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s declares 1–2 valid, distinct styles", (_key, template) => {
    expect(template.style.length).toBeGreaterThanOrEqual(1);
    expect(template.style.length).toBeLessThanOrEqual(2);
    for (const style of template.style) expect(TEMPLATE_STYLES).toContain(style);
    expect(new Set(template.style).size).toBe(template.style.length);
  });

  it("every style is some template's main style", () => {
    const main = new Set(CODE_TEMPLATES.map((t) => t.style[0]));
    for (const style of TEMPLATE_STYLES) expect(main.has(style)).toBe(true);
  });

  it("niche templates keep their suffix as the main style", () => {
    for (const template of CODE_TEMPLATES) {
      const suffix = /-(luxe|bold|warm)$/.exec(template.key)?.[1];
      if (suffix) expect(template.style[0]).toBe(suffix);
    }
  });
});

describe("tone and needs", () => {
  it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s has a tone and home needs", (_key, template) => {
    expect(["light", "dark"]).toContain(templateTone(template));
    const needs = templateNeeds(template);
    expect(needs.productCards).toBeGreaterThanOrEqual(0);
    expect(needs.productCards).toBeLessThanOrEqual(24);
    expect(needs.categoryTiles).toBeGreaterThanOrEqual(0);
    expect(needs.categoryTiles).toBeLessThanOrEqual(24);
    expect(templateTraits(template)).toMatchObject({ key: template.key, category: template.category, style: template.style });
  });

  it("every home shows at least one product list", () => {
    for (const template of CODE_TEMPLATES) expect(templateNeeds(template).productCards, template.key).toBeGreaterThan(0);
  });

  it("reads dark homes as dark", () => {
    // arcade and nour were deleted on 2026-11-12 (one template per niche); arena is the dark home left.
    expect(templateTone(getCodeTemplate("arena")!)).toBe("dark");
    expect(templateTone(getCodeTemplate("tallaby-classic")!)).toBe("light");
  });

  it("caches per template", () => {
    const template = getCodeTemplate("zaki")!;
    expect(templateNeeds(template)).toBe(templateNeeds(template));
  });
});

describe("colour helpers", () => {
  it("relative luminance and contrast follow WCAG", () => {
    expect(colorLuminance("#000")).toBe(0);
    expect(colorLuminance("#ffffff")).toBeCloseTo(1);
    expect(colorLuminance("red")).toBeNull();
    expect(colorContrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
    expect(colorContrastRatio("#777", "#777")).toBeCloseTo(1);
  });

  it("tone of a colour", () => {
    expect(toneOfColor("#ffffff")).toBe("light");
    expect(toneOfColor("#f6f3ee")).toBe("light");
    expect(toneOfColor("#0f1117")).toBe("dark");
    expect(toneOfColor("#1a1714")).toBe("dark");
    expect(toneOfColor("not a colour")).toBe("light");
  });
});

describe("treeNeeds", () => {
  it("takes the biggest product list and category list", () => {
    const tree = [
      node("section", {}, [
        node("productList", { source: "newest", limit: 4 }),
        node("productList", { source: "bestsellers", limit: 12 }),
        node("categoryList", { limit: 6 }),
      ]),
    ];
    expect(treeNeeds(tree)).toEqual({ productCards: 12, categoryTiles: 6 });
  });

  it("uses the renderer's defaults and clamps", () => {
    expect(treeNeeds([node("productList"), node("categoryList")])).toEqual({ productCards: 8, categoryTiles: 8 });
    expect(treeNeeds([node("productList", { limit: 999 })]).productCards).toBe(24);
  });

  it("counts picked categories, the Nth category a list asks for, and picked products", () => {
    expect(treeNeeds([node("categoryList", { categoryIds: ["a", "b", "c"], limit: 8 })]).categoryTiles).toBe(3);
    expect(treeNeeds([node("productList", { source: "category", categoryIndex: 4, limit: 4 })])).toEqual({ productCards: 4, categoryTiles: 4 });
    expect(treeNeeds([node("productList", { source: "selected", productIds: ["a", "b"], limit: 8 })]).productCards).toBe(2);
  });

  it("is zero for a tree with no lists", () => {
    expect(treeNeeds([node("section", {}, [node("heading")])])).toEqual({ productCards: 0, categoryTiles: 0 });
    expect(treeNeeds(undefined)).toEqual({ productCards: 0, categoryTiles: 0 });
  });
});
