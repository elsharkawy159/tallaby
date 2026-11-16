/**
 * Every template's home has at least one real products grid (owner,
 * 2026-11-16: "every theme has one products grid section as minimum on the
 * homepage"). A grid is a products-library section with a product list that
 * is not a swipe rail, shows at least 4 products and at least 3 across on
 * desktop. Rows, lists, bento and feature blocks (1 big + 2×2), spotlights
 * and panel rails (3 cards beside a panel), campaigns, deals and category
 * carousels show products but are not a grid on their own. Checked for each
 * template's own build and for every edition (pack) on each of its looks.
 */
import { describe, expect, it } from "vitest";
import type { ComponentNode, SectionInstance } from "../config/schema";
import { CODE_TEMPLATES } from "./catalog";
import { applyEdition, EDITIONS } from "./editions";
import type { TemplateDefinition } from "./types";

/** Product sections that are not a grid on their own. */
const NOT_A_GRID = new Set([
  "products-rows",
  "products-list",
  "products-bento",
  "products-feature",
  "products-spotlight",
  "products-panel-rail",
  "products-campaign",
  "products-category-carousel",
  "products-deal",
]);

const walk = (nodes: readonly ComponentNode[] | undefined): ComponentNode[] => (nodes ?? []).flatMap((n) => [n, ...walk(n.children)]);

const libraryId = (template: TemplateDefinition, section: SectionInstance): string | undefined => {
  const design = template.designs.find((d) => d.id === section.id);
  return design?.libraryId ?? design?.id;
};

const isGridList = (node: ComponentNode) =>
  node.type === "productList" && node.props.rail !== true && Number(node.props.limit) >= 4 && Number(node.style?.columns) >= 3;

/** The home's grid sections, by library id. */
function homeGrids(template: TemplateDefinition): string[] {
  const home = template.config().pages.find((p) => p.isHome)!.content.sections;
  return home
    .map((section) => [section, libraryId(template, section)] as const)
    .filter(([section, id]) => !!id && id.startsWith("products-") && !NOT_A_GRID.has(id) && walk(section.componentTree).some(isGridList))
    .map(([, id]) => id!);
}

describe("every template's home has a products grid", () => {
  it.each(CODE_TEMPLATES.map((t) => [t.key, t] as const))("%s", (key, template) => {
    expect(homeGrids(template), `${key}: add a products grid (products-grid, -classic, -tabs-grid, -boxed, -rail, …) to the home`).not.toEqual([]);
  });

  const pairs = EDITIONS.flatMap((edition) => edition.looks.map((look) => [`${edition.niche} on ${look}`, edition, look] as const));
  it.each(pairs)("%s", (_name, edition, look) => {
    const template = CODE_TEMPLATES.find((t) => t.key === look)!;
    expect(homeGrids(applyEdition(template, edition))).not.toEqual([]);
  });
});
