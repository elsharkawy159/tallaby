/**
 * The data a code section's Liquid can read (ROADMAP F-101, code-sections design
 * §4.3, §4.4 and §11.4). Version 1 is frozen once shipped: fields are only ever
 * added; a rename or removal needs `apiVersion: 2` while version 1 keeps
 * rendering.
 *
 * Everything here is a plain object of the request's store only (rule 5).
 * Prices are integers in minor units (1/100 of the store currency, matching the
 * `numeric(10,2)` columns); the `money` filters format them.
 */

export const LIQUID_API_VERSION = 1 as const;
export type LiquidApiVersion = typeof LIQUID_API_VERSION;

/**
 * Markup the engine prints without escaping: `{{ x }}` escapes every other
 * value. Used for `block.attributes` and for HTML fields the host already
 * cleaned (rich text). A filter that changes it (e.g. `| truncate`) gets its
 * text and returns plain text, which is escaped again. It is a plain class
 * (not a liquidjs Drop), so own-property-only reads can't reach its prototype.
 */
export class LiquidHtml {
  readonly html: string;
  constructor(html: string) {
    this.html = html;
  }
  toString(): string {
    return this.html;
  }
}

export type LiquidImage = { src: string; alt: string; width: number | null; height: number | null };

export type LiquidVariant = { id: string; title: string; price: number; available: boolean };

export type LiquidProduct = {
  id: string;
  title: string;
  handle: string;
  url: string;
  /** Minor units. The lowest variant price when the product has variants. */
  price: number;
  compare_at_price: number | null;
  price_min: number;
  price_max: number;
  available: boolean;
  featured_image: LiquidImage | null;
  images: LiquidImage[];
  variants: LiquidVariant[];
  /** The brand name. */
  vendor: string;
  /** The category name. */
  type: string;
  on_sale: boolean;
  rating: number | null;
  review_count: number;
};

/** A Tallaby category. */
export type LiquidCollection = {
  id: string;
  title: string;
  handle: string;
  url: string;
  image: LiquidImage | null;
  products: LiquidProduct[];
  products_count: number;
};

export type LiquidBlock = {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  /** `data-block-id="<id>"`, for the builder to find the block. */
  attributes: LiquidHtml;
};

export type LiquidSection = { id: string; settings: Record<string, unknown>; blocks: LiquidBlock[] };

export type LiquidShop = {
  name: string;
  url: string;
  logo: LiquidImage | null;
  currency: string;
  locale: "ar" | "en";
  dir: "rtl" | "ltr";
};

export type LiquidRequest = { locale: "ar" | "en"; page_type: string; design_mode: boolean };

export type LiquidRoutes = { root_url: string; collections_url: string; cart_url: string; search_url: string };

export type LiquidLocalization = {
  language: { iso_code: "ar" | "en"; name: string };
  direction: "rtl" | "ltr";
};

export type LiquidScope = {
  section: LiquidSection;
  /** Set when a block's own markup is rendered; inside `{% for block in section.blocks %}` the loop sets it. */
  block?: LiquidBlock | null;
  /** The product of the list item or product page around the node; null elsewhere. */
  product?: LiquidProduct | null;
  collection?: LiquidCollection | null;
  shop: LiquidShop;
  /** Alias of `shop` (design §4.3). */
  store?: LiquidShop;
  request: LiquidRequest;
  routes: LiquidRoutes;
  /** The store design system (colours, fonts, radius). */
  settings: Record<string, unknown>;
  localization: LiquidLocalization;
};

/** Escapes text for a double-quoted HTML attribute. */
export function escapeAttribute(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export function toLiquidBlock(block: { id: string; type: string; settings: Record<string, unknown> }): LiquidBlock {
  return {
    id: block.id,
    type: block.type,
    settings: block.settings,
    attributes: new LiquidHtml(`data-block-id="${escapeAttribute(block.id)}"`),
  };
}

// ---------------------------------------------------------------------------
// Product mapper
// ---------------------------------------------------------------------------

export const MAX_LIQUID_IMAGES = 20;
export const MAX_LIQUID_VARIANTS = 50;

/**
 * What `toLiquidProduct` needs from a catalog row, already localised to the
 * request locale and already scoped to the request's store. Prices are major
 * units as stored (`numeric(10,2)`, e.g. 249.5). The catalog wiring maps its
 * rows to this later (F-101d).
 */
export interface LiquidProductInput {
  id: string;
  title: string;
  slug: string;
  url: string;
  price: number;
  compareAtPrice?: number | null;
  available: boolean;
  images?: readonly { url: string; alt?: string | null; width?: number | null; height?: number | null }[];
  brandName?: string | null;
  categoryName?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  variants?: readonly { id: string; title: string; price: number; available: boolean }[];
}

/**
 * Major units → integer minor units (1/100). The two decimals of a
 * `numeric(10,2)` amount are read as digits, so float error in `amount * 100`
 * (e.g. 1.1 * 100 = 110.00000000000001) never reaches the result.
 */
export function toMinorUnits(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  const [whole = "0", fraction = ""] = Math.abs(amount).toFixed(2).split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return amount < 0 ? -minor : minor;
}

function toImage(image: NonNullable<LiquidProductInput["images"]>[number], fallbackAlt: string): LiquidImage {
  return {
    src: image.url,
    alt: image.alt || fallbackAlt,
    width: image.width ?? null,
    height: image.height ?? null,
  };
}

/** The version-1 product object. No cost price, stock counts, seller ids or other internal fields. */
export function toLiquidProduct(row: LiquidProductInput): LiquidProduct {
  const variants = (row.variants ?? []).slice(0, MAX_LIQUID_VARIANTS).map((v) => ({
    id: v.id,
    title: v.title,
    price: toMinorUnits(v.price),
    available: v.available,
  }));
  const base = toMinorUnits(row.price);
  const prices = variants.length ? variants.map((v) => v.price) : [base];
  const priceMin = Math.min(...prices);
  const priceMax = Math.max(...prices);
  const price = variants.length ? priceMin : base;
  const compare = row.compareAtPrice != null && row.compareAtPrice > 0 ? toMinorUnits(row.compareAtPrice) : null;
  const images = (row.images ?? []).slice(0, MAX_LIQUID_IMAGES).map((img) => toImage(img, row.title));
  return {
    id: row.id,
    title: row.title,
    handle: row.slug,
    url: row.url,
    price,
    compare_at_price: compare,
    price_min: priceMin,
    price_max: priceMax,
    available: row.available,
    featured_image: images[0] ?? null,
    images,
    variants,
    vendor: row.brandName ?? "",
    type: row.categoryName ?? "",
    on_sale: compare != null && compare > price,
    rating: row.rating ?? null,
    review_count: row.reviewCount ?? 0,
  };
}
