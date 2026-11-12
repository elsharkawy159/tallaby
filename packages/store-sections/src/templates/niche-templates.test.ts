/**
 * The niche templates (2026-10-28): three per niche (two for beauty and jewelry), each with the fixed
 * 12-slot home (top bar and header, hero, categories, products, about, four
 * "products by category" rows, newsletter, footer). Checks what the brief
 * asks that the shared template tests don't: the slot order, the four rows
 * bound to category places 1–4 with each place's demo category filling its
 * row, no photo used twice, and within a niche no shared header, hero,
 * categories or footer, with at least one video hero and one hero carousel.
 *
 * The look-first pilot templates (docs/systems/plan.md §10, 2026-11-11) leave
 * the fixed 12-slot home: they follow the look-first rhythm instead (hero,
 * categories, at most nine sections, a break between product sections, the
 * newsletter last), and their demo categories need four products, not eight.
 */
import { describe, expect, it } from "vitest";
import type { ComponentNode } from "../config/schema";
import { CODE_TEMPLATES } from "./catalog";
import type { TemplateDefinition } from "./types";

/** Niche → its three template keys. */
const NICHES: Record<string, readonly string[]> = {
  furniture: ["furniture-luxe", "furniture-bold", "furniture-warm"],
  fashion: ["fashion-luxe", "fashion-bold", "fashion-warm"],
  electronics: ["electronics-luxe", "electronics-bold", "electronics-warm"],
  kids: ["kids-luxe", "kids-bold", "kids-warm"],
  // beauty-warm removed by the owner (2026-11-03).
  beauty: ["beauty-luxe", "beauty-bold"],
  grocery: ["grocery-luxe", "grocery-bold", "grocery-warm"],
  perfumes: ["perfumes-luxe", "perfumes-bold", "perfumes-warm"],
  // jewelry-bold deleted with the accessories switch (2026-11-12, one template per niche).
  jewelry: ["jewelry-luxe", "jewelry-warm"],
  gifts: ["gifts-luxe", "gifts-bold", "gifts-warm"],
  sports: ["sports-luxe", "sports-bold", "sports-warm"],
};

const walk = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] => (nodes ?? []).flatMap((n) => [n, ...walk(n.children)]);
/** `walk` without a steps section's photo column (`image-text-steps`): it repeats each step's own photo by design, shown in its place on phones. */
const walkShown = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] =>
  (nodes ?? []).flatMap((n) => (n.props.role === "steps-media" ? [] : [n, ...walkShown(n.children)]));
const byKey = new Map(CODE_TEMPLATES.map((t) => [t.key, t]));
const libraryIdOf = (template: TemplateDefinition, sectionId: string) => {
  const design = template.designs.find((d) => d.id === sectionId);
  return design?.libraryId ?? design?.id;
};
const SLOTS = ["hero", "categories", "products", "image-text", "products", "products", "products", "products", "newsletter"];
/** Rebuilt in the look-first pilot: their home follows the look-first rhythm, not the 12 slots. */
const LOOK_FIRST = new Set(["fashion-luxe", "perfumes-bold", "jewelry-warm", "fashion-bold"]);

describe.each(Object.entries(NICHES))("niche %s", (_niche, keys) => {
  const templates = keys.map((key) => byKey.get(key)!);

  it("has its three templates registered", () => {
    expect(templates.every(Boolean)).toBe(true);
  });

  describe.each(keys.map((key) => [key] as const))("%s", (key) => {
    const template = byKey.get(key)!;
    const config = template.config();
    const home = config.pages.find((p) => p.isHome)!.content.sections;
    const categoryOf = (id: string) => template.designs.find((d) => d.id === id)?.category;

    it.runIf(LOOK_FIRST.has(key))("follows the look-first home: hero, categories, a break between product sections, newsletter last", () => {
      const slots = home.map((s) => categoryOf(s.id));
      expect(slots.slice(0, 2)).toEqual(["hero", "categories"]);
      expect(slots.at(-1)).toBe("newsletter");
      expect(slots.length).toBeLessThanOrEqual(9);
      slots.forEach((slot, i) => expect(slot === "products" && slots[i + 1] === "products", `${home[i]!.id} then ${home[i + 1]?.id}`).toBe(false));
      expect(walk(config.header?.componentTree).some((n) => n.props.role === "announcement")).toBe(true);
      // Every demo category can fill a row of four.
      for (const category of template.demo.categories) {
        expect(template.demo.products.filter((p) => p.categoryId === category.id).length, category.id).toBeGreaterThanOrEqual(4);
      }
    });

    it.skipIf(LOOK_FIRST.has(key))("follows the 12-slot home: top bar header, the nine home sections in order, footer", () => {
      expect(home.map((s) => categoryOf(s.id))).toEqual(SLOTS);
      expect(walk(config.header?.componentTree).some((n) => n.props.role === "announcement")).toBe(true);
    });

    it.skipIf(LOOK_FIRST.has(key))("binds rows 7–10 to category places 1–4, heading and products alike", () => {
      const rows = home.slice(4, 8);
      rows.forEach((row, i) => {
        const nodes = walk(row.componentTree);
        expect(nodes.find((n) => n.type === "categoryList")?.props.offset ?? 0, row.id).toBe(i);
        expect(nodes.find((n) => n.type === "productList")?.props, row.id).toMatchObject({ source: "category", categoryIndex: i + 1 });
      });
      // Each place's demo category has a full row of its own products.
      for (const category of template.demo.categories.slice(0, 4)) {
        expect(template.demo.products.filter((p) => p.categoryId === category.id).length, category.id).toBeGreaterThanOrEqual(8);
      }
    });

    it("uses no photo twice (products, categories and sections)", () => {
      const urls = [
        ...template.demo.products.map((p) => p.image),
        ...template.demo.categories.map((c) => c.image),
        ...[config.header, config.footer, ...home].flatMap((s) => walkShown(s?.componentTree)).flatMap((n) => [n.props.src, n.props.poster]),
      ].filter((u): u is string => typeof u === "string" && u.startsWith("https://"));
      const ids = urls.map((u) => u.replace(/\?.*$/, ""));
      expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    });
  });

  it("shares no header, hero, categories or footer design between its templates", () => {
    const configs = templates.map((t) => ({ t, c: t.config() }));
    const pick = (fn: (x: (typeof configs)[number]) => string | undefined) => configs.map(fn);
    const homeOf = (x: (typeof configs)[number]) => x.c.pages.find((p) => p.isHome)!.content.sections;
    for (const ids of [
      pick((x) => libraryIdOf(x.t, x.c.header!.id)),
      pick((x) => libraryIdOf(x.t, x.c.footer!.id)),
      pick((x) => libraryIdOf(x.t, homeOf(x)[0]!.id)),
      pick((x) => libraryIdOf(x.t, homeOf(x)[1]!.id)),
    ]) {
      expect(new Set(ids).size, ids.join(", ")).toBe(keys.length);
    }
    // A niche of three offers a video hero and a carousel hero. Jewelry keeps two since jewelry-bold was deleted (one template per niche, 2026-11-12), with a video hero and no carousel.
    const heroes = pick((x) => libraryIdOf(x.t, homeOf(x)[0]!.id));
    expect(heroes).toContain("hero-video");
    if (_niche !== "jewelry") expect(heroes.some((id) => id?.startsWith("hero-carousel"))).toBe(true);
  });
});
