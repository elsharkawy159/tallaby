/**
 * What "Use template" puts in a store's drafts (owner, 2026-10-23): the
 * template's look, with only the sections that show the seller's own data,
 * so a store never starts with a template's demo copy and photos.
 *
 * - Home page: its hero (the first `hero` section, else the page's first
 *   section) and every section that lists store records (products,
 *   categories, blog posts). The first product grid after the hero shows 12
 *   products per page with page links (`paginate`).
 * - Other pages: their page header and every section with store records or a
 *   store form (a contact page keeps its form).
 * - The product page (`kind: "product"`): every section with a product element
 *   (gallery, buy box, content, reviews, ...) or a record list (related products),
 *   because the page is useless without them; template copy such as the
 *   `product-perks` and `product-shipping` extras is dropped.
 * - Header and footer stay as they are.
 *
 * The gallery still previews the whole template; the seller adds the rest
 * from Add › Sections, where the template's own designs come first
 * (`preferTemplatePresets`). Pure, no React here.
 */
import type { ComponentNode, SectionInstance, SiteConfig } from "../config/schema";
import { isProductPage } from "../config/product-page.lib";
import { getDesign } from "../designs";
import type { LibraryCategoryId } from "../library/types";
import { getTemplateDesign } from "./catalog";

/** Products per page of the home page's main product grid. */
export const HOME_GRID_PAGE_SIZE = 12;

const RECORD_LISTS = new Set(["productList", "categoryList", "postList"]);

/** The product page's elements: they show the product being viewed. */
export const PRODUCT_ELEMENT_TYPES: ReadonlySet<string> = new Set([
  "productBreadcrumbs",
  "productGallery",
  "productPrice",
  "productStock",
  "productRating",
  "productVariants",
  "productBuyBox",
  "productDetails",
  "productContent",
  "productSeller",
  "productReviews",
]);

/** The design id in an instance's `source` (`<design>@<version>`). */
export function sourceDesignId(section: SectionInstance): string | null {
  return section.source?.replace(/@\d+$/, "") ?? null;
}

/** The library category of a template section: its template design's, else the library design's. */
export function sectionCategory(section: SectionInstance): LibraryCategoryId | null {
  const id = sourceDesignId(section);
  if (!id) return null;
  return (getTemplateDesign(id) ?? getDesign(id))?.category ?? null;
}

function hasNode(nodes: readonly ComponentNode[] | undefined, match: (node: ComponentNode) => boolean): boolean {
  return (nodes ?? []).some((node) => match(node) || hasNode(node.children, match));
}

const listsRecords = (section: SectionInstance) => hasNode(section.componentTree, (node) => RECORD_LISTS.has(node.type));
const hasForm = (section: SectionInstance) => hasNode(section.componentTree, (node) => node.type === "storeForm");

/** The section with its first product list paginated, or null when it has none. */
function paginateFirstList(section: SectionInstance): SectionInstance | null {
  let done = false;
  const visit = (node: ComponentNode): ComponentNode => {
    if (done) return node;
    if (node.type === "productList") {
      done = true;
      const { offset: _offset, ...props } = node.props ?? {};
      return { ...node, props: { ...props, limit: HOME_GRID_PAGE_SIZE, paginate: true } };
    }
    return { ...node, children: node.children.map(visit) };
  };
  const componentTree = section.componentTree?.map(visit);
  return done ? { ...section, componentTree } : null;
}

function homeSections(sections: readonly SectionInstance[]): SectionInstance[] {
  const hero = sections.find((s) => sectionCategory(s) === "hero") ?? sections[0];
  const kept = sections.filter((s) => s === hero || listsRecords(s));
  // The main grid: the first product section's list, else the first list after the hero.
  const grid = kept.find((s) => s !== hero && sectionCategory(s) === "products" && hasNode(s.componentTree, (n) => n.type === "productList"))
    ?? kept.find((s) => s !== hero && hasNode(s.componentTree, (n) => n.type === "productList"));
  return kept.map((s) => (s === grid ? (paginateFirstList(s) ?? s) : s));
}

function pageSections(sections: readonly SectionInstance[]): SectionInstance[] {
  return sections.filter((s) => sectionCategory(s) === "page-header" || listsRecords(s) || hasForm(s));
}

function productPageSections(sections: readonly SectionInstance[]): SectionInstance[] {
  return sections.filter((s) => listsRecords(s) || hasNode(s.componentTree, (node) => PRODUCT_ELEMENT_TYPES.has(node.type)));
}

function essentialSections(page: SiteConfig["pages"][number]): SectionInstance[] {
  if (isProductPage(page)) return productPageSections(page.content.sections);
  return page.isHome ? homeSections(page.content.sections) : pageSections(page.content.sections);
}

/** The template with only the sections a store starts with (see the file comment). */
export function templateEssentials(config: SiteConfig): SiteConfig {
  return {
    ...config,
    pages: config.pages.map((page) => ({
      ...page,
      content: { ...page.content, sections: essentialSections(page) },
    })),
  };
}
