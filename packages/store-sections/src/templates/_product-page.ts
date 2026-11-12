/**
 * The product page every library-built template has (spec §5.6): the
 * library's product page designs (`designs/product-page/`) as the template's
 * own sections, styled by a compact spec. Every spec field is a patch on the
 * designs' layer labels, so colours and fonts still come from the design
 * system tokens and a seller's design-system change restyles the page.
 * No React here.
 */
import { PRODUCT_PAGE_SLUG } from "../config/product-page.lib";
import type { SitePage } from "../config/schema";
import { L } from "../designs/_kit";
import { instantiateDesign, type Design, type DesignText } from "../designs/builder";
import type { ElementIconName } from "../elements/registry";
import type { StyleValues } from "../elements/style";
import type { NodeTemplate } from "../elements/tree";
import type { NodePatch } from "./_library";
import type { Lib } from "./_pages";

export type ProductPageSpec = {
  /** Gallery side on desktop (below desktop the photos always come first); default "start". */
  gallery?: "start" | "end";
  /** Gallery thumbnails; default "bottom". */
  thumbs?: "side" | "bottom" | "none";
  /**
   * Buy column treatment. `libraryTemplate` defaults it from the template's
   * corners (0 → "flat", else "card"); on its own the default is "card".
   */
  surface?: "flat" | "card" | "shelf";
  /** Heading case of the product name and section titles; default "none". */
  headingCase?: "none" | "upper";
  /** Buy box primary button (the buy box `variant`); default "solid". */
  button?: "solid" | "outline";
  /** Reviews section background; default "shelf". */
  band?: "paper" | "shelf" | "brand";
  /**
   * Template copy: reviews title and related products title (the breadcrumbs use the package's own copy),
   * and the four `product-perks` tiles in order, when the store's promises differ from the library's
   * (its returns and payment lines must not contradict the home page).
   */
  copy?: { reviews?: DesignText; related?: DesignText; perks?: readonly ProductPerk[] };
  /**
   * Store-wide library sections inserted after the main section; default none.
   * With `product-perks`, the buy box's own perks box is switched off.
   */
  extras?: readonly ("product-perks" | "product-shipping")[];
};

/** One `product-perks` tile: its title, its line, and an icon (default: the library's). */
export type ProductPerk = { icon?: ElementIconName; title: DesignText; text: DesignText };

/** The product page's name in both languages (`pageNames.product`). */
export const PRODUCT_PAGE_NAME = L("صفحة المنتج", "Product page");

// Layer labels of the library designs (Arabic, as the designs write them).
const GALLERY = "صور المنتج";
const BUY_COLUMN = "عمود الشراء";
const TITLE = "اسم المنتج";
const BUY_BOX = "زر الشراء";
const REVIEWS = "التقييمات";
const REVIEWS_COLUMN = "العمود";
const REVIEWS_CONTAINER = "الحاوية";
const SECTION_TITLE = "العنوان";
// The designs' copy the template copy replaces.
const REVIEWS_COPY = "رأي اللي جربوه";
const RELATED_COPY = "ممكن يعجبك كمان";
// The `product-perks` tiles' copy, in order (title, line).
const PERKS_COPY: readonly (readonly [string, string])[] = [
  ["توصيل سريع", "من يوم لـ ٤ أيام"],
  ["ضمان المتجر", "بفاتورة رسمية"],
  ["استرجاع ١٤ يوم", "من غير أسئلة"],
  ["ادفع عند الاستلام", "كاش أو كارت"],
];

function headingStyle(spec: ProductPageSpec): StyleValues | undefined {
  return spec.headingCase === "upper" ? { textTransform: "uppercase" } : undefined;
}

const PANEL = { paddingTop: 28, paddingBottom: 28, paddingStart: 28, paddingEnd: 28, radius: 24 } as const;
const PANEL_MOBILE = { paddingTop: 18, paddingBottom: 18, paddingStart: 18, paddingEnd: 18 } as const;

const SURFACES: Record<"card" | "shelf", NodePatch> = {
  card: { style: { ...PANEL, background: "background", borderWidth: 1, borderColor: "border" }, mobile: PANEL_MOBILE },
  shelf: { style: { ...PANEL, background: "secondary" }, mobile: PANEL_MOBILE },
};

/** Reviews band: a shelf or paper background, or a brand band with the reviews on a paper card. */
function bandNodes(band: NonNullable<ProductPageSpec["band"]>): Record<string, NodePatch> {
  if (band === "paper") return { [REVIEWS]: { style: { background: "background" } } };
  if (band === "shelf") return { [REVIEWS]: { style: { background: "secondary" } } };
  return {
    [REVIEWS]: { style: { background: "primary" } },
    // As wide as the related products below: the panel spans the band, not a 960px column.
    [REVIEWS_CONTAINER]: { style: { maxWidth: "100%" } },
    [REVIEWS_COLUMN]: { style: { ...PANEL, background: "background" }, mobile: PANEL_MOBILE },
  };
}

/**
 * The product page sections from the template's `lib`: the gallery and buy
 * box, the extras, the product's content, its reviews, related products.
 */
export function productPage(lib: Lib, spec: ProductPageSpec = {}): Design[] {
  const heading = headingStyle(spec);
  const withHeading = (nodes: Record<string, NodePatch>, label: string) => (heading ? { ...nodes, [label]: { ...nodes[label], style: { ...nodes[label]?.style, ...heading } } } : nodes);

  const mainNodes: Record<string, NodePatch> = {
    [GALLERY]: { props: { thumbs: spec.thumbs ?? "bottom" }, ...(spec.gallery === "end" && { style: { order: 2 }, tablet: { order: 0 } }) },
  };
  // The perks section already says what the buy box's perks box would: keep one.
  const buyBoxProps = { ...(spec.button === "outline" && { variant: "outline" }), ...(spec.extras?.includes("product-perks") && { perks: false }) };
  if (Object.keys(buyBoxProps).length) mainNodes[BUY_BOX] = { props: buyBoxProps };
  const surface = spec.surface ?? "card";
  if (surface !== "flat") mainNodes[BUY_COLUMN] = SURFACES[surface];

  const main = lib("product-main", { nodes: withHeading(mainNodes, TITLE) });
  const reviews = lib("product-reviews", {
    nodes: withHeading(bandNodes(spec.band ?? "shelf"), SECTION_TITLE),
    ...(spec.copy?.reviews && { text: { [REVIEWS_COPY]: spec.copy.reviews } }),
  });
  const related = lib("product-related", {
    ...(heading && { nodes: { [SECTION_TITLE]: { style: heading } } }),
    ...(spec.copy?.related && { text: { [RELATED_COPY]: spec.copy.related } }),
  });
  const extra = (id: NonNullable<ProductPageSpec["extras"]>[number]) => (id === "product-perks" && spec.copy?.perks ? perks(lib, spec.copy.perks) : lib(id));
  return [main, ...(spec.extras ?? []).map(extra), lib("product-content"), reviews, related];
}

/** The perks tiles with the store's own promises: copy by the library's text, icons in tree order. */
function perks(lib: Lib, items: readonly ProductPerk[]): Design {
  if (items.length !== PERKS_COPY.length) throw new Error(`productPage: copy.perks needs ${PERKS_COPY.length} tiles, it has ${items.length}`);
  const text: Record<string, DesignText> = {};
  items.forEach((item, i) => {
    text[PERKS_COPY[i]![0]] = item.title;
    text[PERKS_COPY[i]![1]] = item.text;
  });
  const design = lib("product-perks", { text });
  return {
    ...design,
    tree: (t) => {
      let index = 0;
      const visit = (node: NodeTemplate): NodeTemplate => {
        const icon = node.type === "icon" ? items[index++]?.icon : undefined;
        const next = icon ? { ...node, props: { ...node.props, name: icon } } : node;
        return next.children ? { ...next, children: next.children.map(visit) } : next;
      };
      return visit(design.tree(t));
    },
  };
}

/** A design as a template section: its id doubles as the instance id (as in `libraryTemplate`). */
const section = (design: Design) => instantiateDesign(design, { id: design.id, defaultLocale: "ar" });

/** The hidden product page (`kind: "product"`) of a template's product page designs. */
export function productSitePage(designs: readonly Design[]): SitePage {
  return {
    kind: "product",
    slug: PRODUCT_PAGE_SLUG,
    isHome: false,
    name: PRODUCT_PAGE_NAME.ar,
    showInNav: false,
    seo: {},
    content: { sections: designs.map(section) },
  };
}
