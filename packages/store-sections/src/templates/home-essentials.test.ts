/**
 * Every template's home has what a seller needs once they apply it (owner,
 * 2026-11-25): a products grid with page links, a products-by-category
 * section and a products carousel (a swipe row of products).
 *
 * - by-category: a products-library section with a product list of one
 *   category (`source: "category"`, e.g. `products-category-carousel`);
 * - carousel: a products-library section with a carousel product list
 *   (`rail: true`, four cards in view with arrows on desktop and a swipe on
 *   phones). A list that only swipes on phones (`mobileRail`, e.g.
 *   `products-carousel`, `products-rail`) is a grid on desktop, not a carousel;
 * - pagination: what "Use template" copies (`templateEssentials`) has exactly
 *   one paginated list on the home, and it is the grid (not a carousel, at
 *   least 3 across on desktop).
 *
 * The grid itself is checked by `products-grid.test.ts`. Checked for each
 * template's own build and for every edition (pack) on each of its looks.
 */
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance, SiteConfig } from "../config/schema";
import { CODE_TEMPLATES } from "./catalog";
import { applyEdition, EDITIONS } from "./editions";
import { isGridProductList, sectionCategory, templateEssentials } from "./essentials";
import type { TemplateDefinition } from "./types";

const walk = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] => (nodes ?? []).flatMap((n) => [n, ...walk(n.children)]);

const homeOf = (config: SiteConfig): SectionInstance[] => config.pages.find((p) => p.isHome)!.content.sections;

const productLists = (sections: readonly SectionInstance[]): ComponentNode[] =>
  sections.filter((s) => sectionCategory(s) === "products").flatMap((s) => walk(s.componentTree)).filter((n) => n.type === "productList");

function check(key: string, template: TemplateDefinition) {
  const config = template.config();
  const lists = productLists(homeOf(config));
  expect(lists.some((n) => n.props.source === "category"), `${key}: add a products-by-category section (e.g. products-category-carousel) to the home`).toBe(true);
  expect(lists.some((n) => n.props.rail === true), `${key}: add a products carousel (rail, e.g. products-category-carousel) to the home`).toBe(true);

  const paginated = walk(homeOf(templateEssentials(config)).flatMap((s) => s.componentTree ?? [])).filter((n) => n.props?.paginate === true);
  expect(paginated, `${key}: the applied home must paginate exactly one list`).toHaveLength(1);
  expect(isGridProductList(paginated[0]!), `${key}: the paginated list must be the home's grid (no rail, 3+ across)`).toBe(true);
}

describe("every template's home has a grid with page links, products by category and a carousel", () => {
  it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s", (key, template) => check(key, template));

  const pairs = EDITIONS.flatMap((edition) => edition.looks.map((look) => [`${edition.niche} on ${look}`, edition, look] as const));
  it.each(pairs)("%s", (name, edition, look) => check(name, applyEdition(CODE_TEMPLATES.find((t) => t.key === look)!, edition)));
});
