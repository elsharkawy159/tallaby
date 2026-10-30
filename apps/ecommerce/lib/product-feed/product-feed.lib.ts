/**
 * Store product feed (ROADMAP.md F-11a). Pure: rows in, feed items and the
 * XML / CSV text out, so every rule here is unit-tested.
 *
 * One feed serves Meta Commerce (catalog data feed), Google Merchant Center
 * and TikTok catalog: RSS 2.0 with the Google `g:` namespace, which all three
 * read, or the same columns as CSV. Prices follow the storefront
 * (`productPricing`): `price` is the regular price and `sale_price` the
 * discounted one when the seller set a higher list price.
 */
import { parsePriceJson } from "@workspace/lib";
import { getVariantDisplayFields } from "@/lib/variant-localized";
import { parseVariantOption } from "@/lib/variant-utils";

export type FeedLocale = "ar" | "en";
export type FeedFormat = "xml" | "csv";

/** Most items one feed lists (newest products first). */
export const FEED_ITEM_LIMIT = 5000;

/** Platform limits: Google cuts titles at 150 and descriptions at 5000 characters. */
const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;
/** Google reads at most 10 additional images. */
const ADDITIONAL_IMAGES_MAX = 10;

export interface FeedTranslation {
  title: string;
  /** Plain text (rich text already flattened on the server). */
  description: string;
  /** Null when this store host cannot open the product by it (no slug, or another seller's older product owns it). */
  slug: string | null;
}

export interface FeedVariantRow {
  id: string;
  price: unknown;
  stock: number;
  /** Public URLs. */
  images: string[];
  title: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  localized: unknown;
}

/** One active product of the store, as the server caches it. Plain JSON. */
export interface FeedProductRow {
  id: string;
  price: unknown;
  quantity: number;
  condition: string | null;
  /** Public image URLs, gallery order. */
  images: string[];
  /** Public video URLs found in the gallery. */
  videos: string[];
  brand: { ar: string | null; en: string | null } | null;
  /** The store category name (seller category, else Tallaby category). */
  productType: { ar: string | null; en: string | null } | null;
  googleCategory: string | null;
  translations: Partial<Record<FeedLocale, FeedTranslation>>;
  variants: FeedVariantRow[];
}

export interface FeedItem {
  id: string;
  itemGroupId: string | null;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  videoLink: string | null;
  availability: "in stock" | "out of stock";
  condition: "new" | "refurbished" | "used";
  price: string;
  salePrice: string | null;
  brand: string;
  googleProductCategory: string | null;
  productType: string | null;
  color: string | null;
  size: string | null;
}

export interface FeedStoreInfo {
  /** Canonical origin: the custom domain when live, else the subdomain. No trailing slash. */
  baseUrl: string;
  name: string;
  description: string | null;
  /** ISO code of the store's currency (Store settings › General). */
  currency: string;
}

/* ------------------------------------------------------------------------ */
/* Field rules                                                              */
/* ------------------------------------------------------------------------ */

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(?:[?#].*)?$/i;

/** Whether a gallery entry (storage path or URL) is a video file. */
export function isVideoPath(path: string): boolean {
  return VIDEO_EXT.test(path.trim());
}

export function mapFeedCondition(condition: string | null | undefined): FeedItem["condition"] {
  switch (condition) {
    case "renewed":
    case "refurbished":
      return "refurbished";
    case "used_like_new":
    case "used_very_good":
    case "used_good":
    case "used_acceptable":
      return "used";
    default:
      return "new";
  }
}

/** "1250.00 EGP": the format Google, Meta and TikTok all accept. */
export function formatFeedPrice(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`;
}

/** Regular and sale price of a product, or of one of its variants, as the storefront shows them. */
export function feedPricing(productPrice: unknown, variantPrice?: unknown): { regular: number; sale: number | null } | null {
  const product = parsePriceJson(productPrice);
  if (variantPrice === undefined) {
    if (!(product.final > 0)) return null;
    const list = product.list != null && product.list > product.final ? product.list : null;
    return list != null ? { regular: list, sale: product.final } : { regular: product.final, sale: null };
  }
  const variant = parsePriceJson(variantPrice);
  if (!(variant.final > 0)) return null;
  // As productPricing: the variant's own list price, else the product's when it is higher.
  const list =
    variant.list != null && variant.list > variant.final
      ? variant.list
      : product.list != null && product.list > variant.final
        ? product.list
        : null;
  return list != null ? { regular: list, sale: variant.final } : { regular: variant.final, sale: null };
}

/** One line, no control characters, at most `max` characters (on a code point boundary). */
export function cleanText(value: string | null | undefined, max: number): string {
  // eslint-disable-next-line no-control-regex
  const text = (value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  const chars = Array.from(text);
  return chars.length > max ? chars.slice(0, max).join("").trimEnd() : text;
}

/** The product page on this store host: Arabic unprefixed, English under /en (as the store sitemap). */
export function feedProductUrl(baseUrl: string, locale: FeedLocale, slug: string): string {
  return `${baseUrl}${locale === "en" ? "/en" : ""}/products/${encodeURIComponent(slug)}`;
}

const COLOR_TYPES = new Set(["color", "colour", "اللون", "لون"]);
const SIZE_TYPES = new Set(["size", "المقاس", "مقاس", "الحجم", "حجم", "المقاسات"]);

/** A variant's label ("Red / XL") and its color and size, in the feed's language. */
export function variantAttributes(variant: FeedVariantRow, locale: FeedLocale): { label: string; color: string | null; size: string | null } {
  const display = getVariantDisplayFields(variant, locale);
  let color: string | null = null;
  let size: string | null = null;
  const values: string[] = [];
  for (const option of [display.option1, display.option2, display.option3]) {
    const parsed = parseVariantOption(option);
    if (!parsed?.value) continue;
    values.push(parsed.value);
    const type = parsed.typeName.trim().toLowerCase();
    if (!color && COLOR_TYPES.has(type)) color = parsed.value;
    else if (!size && SIZE_TYPES.has(type)) size = parsed.value;
  }
  const label = values.length ? values.join(" / ") : (display.title || variant.title || "").trim();
  return { label, color, size };
}

/* ------------------------------------------------------------------------ */
/* Items                                                                    */
/* ------------------------------------------------------------------------ */

function pick<T>(byLocale: { ar: T | null; en: T | null } | null, locale: FeedLocale): T | null {
  if (!byLocale) return null;
  return (locale === "en" ? (byLocale.en ?? byLocale.ar) : (byLocale.ar ?? byLocale.en)) ?? null;
}

/**
 * The feed items of one product: one item, or one per variant sharing the
 * product id as `item_group_id`. Content is in `locale`, falling back to the
 * other language when the product has none; the link follows the content.
 * Nothing for a product with no openable link, no price or no image.
 */
export function buildProductItems(product: FeedProductRow, locale: FeedLocale, store: FeedStoreInfo): FeedItem[] {
  const other: FeedLocale = locale === "ar" ? "en" : "ar";
  const own = product.translations[locale];
  const fallback = product.translations[other];
  const [contentLocale, translation] = own?.slug ? [locale, own] : fallback?.slug ? [other, fallback] : [locale, null];
  if (!translation?.slug || !translation.title.trim()) return [];

  const images = product.images.filter((url) => url && !isVideoPath(url));
  const title = cleanText(translation.title, TITLE_MAX);
  const link = feedProductUrl(store.baseUrl, contentLocale, translation.slug);
  const shared = {
    description: cleanText(translation.description || translation.title, DESCRIPTION_MAX),
    videoLink: product.videos[0] ?? null,
    condition: mapFeedCondition(product.condition),
    brand: cleanText(pick(product.brand, contentLocale) || store.name, 100),
    googleProductCategory: product.googleCategory,
    productType: pick(product.productType, contentLocale) ? cleanText(pick(product.productType, contentLocale), 750) : null,
  };

  const item = (
    fields: Pick<FeedItem, "id" | "itemGroupId" | "title" | "link" | "availability" | "color" | "size">,
    pricing: { regular: number; sale: number | null },
    gallery: string[],
  ): FeedItem | null => {
    const [first, ...rest] = gallery;
    if (!first) return null;
    return {
      ...shared,
      ...fields,
      imageLink: first,
      additionalImageLinks: rest.slice(0, ADDITIONAL_IMAGES_MAX),
      price: formatFeedPrice(pricing.regular, store.currency),
      salePrice: pricing.sale != null ? formatFeedPrice(pricing.sale, store.currency) : null,
    };
  };

  if (!product.variants.length) {
    const pricing = feedPricing(product.price);
    if (!pricing) return [];
    const single = item(
      { id: product.id, itemGroupId: null, title, link, availability: product.quantity > 0 ? "in stock" : "out of stock", color: null, size: null },
      pricing,
      images,
    );
    return single ? [single] : [];
  }

  const items: FeedItem[] = [];
  for (const variant of product.variants) {
    const pricing = feedPricing(product.price, variant.price);
    if (!pricing) continue;
    const { label, color, size } = variantAttributes(variant, contentLocale);
    const gallery = [...new Set([...variant.images.filter((url) => url && !isVideoPath(url)), ...images])];
    const built = item(
      {
        id: variant.id,
        itemGroupId: product.id,
        title: label ? cleanText(`${translation.title} - ${label}`, TITLE_MAX) : title,
        // `?variant=` preselects it on the product page (findVariantIdByToken accepts the id).
        link: `${link}?variant=${encodeURIComponent(variant.id)}`,
        availability: variant.stock > 0 ? "in stock" : "out of stock",
        color: color ? cleanText(color, 100) : null,
        size: size ? cleanText(size, 100) : null,
      },
      pricing,
      gallery,
    );
    if (built) items.push(built);
  }
  return items;
}

/** Items of many products, newest first as given, capped at `limit`. */
export function buildFeedItems(products: readonly FeedProductRow[], locale: FeedLocale, store: FeedStoreInfo, limit = FEED_ITEM_LIMIT): FeedItem[] {
  const items: FeedItem[] = [];
  for (const product of products) {
    for (const item of buildProductItems(product, locale, store)) {
      if (items.length >= limit) return items;
      items.push(item);
    }
  }
  return items;
}

/* ------------------------------------------------------------------------ */
/* XML (RSS 2.0 + g: namespace)                                             */
/* ------------------------------------------------------------------------ */

const XML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" };

/** XML text: escaped, and without the characters XML 1.0 forbids. */
export function escapeFeedXml(value: string): string {
  return value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
    .replace(/[&<>"']/g, (c) => XML_ESCAPES[c]!);
}

export function feedXmlHeader(store: FeedStoreInfo): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">',
    "<channel>",
    `<title>${escapeFeedXml(store.name)}</title>`,
    `<link>${escapeFeedXml(store.baseUrl)}</link>`,
    `<description>${escapeFeedXml(cleanText(store.description || store.name, 500))}</description>`,
    "",
  ].join("\n");
}

export const FEED_XML_FOOTER = "</channel>\n</rss>\n";

export function feedXmlItem(item: FeedItem): string {
  const g = (name: string, value: string | null) => (value ? `<g:${name}>${escapeFeedXml(value)}</g:${name}>` : null);
  const lines = [
    "<item>",
    g("id", item.id),
    g("item_group_id", item.itemGroupId),
    g("title", item.title),
    g("description", item.description),
    g("link", item.link),
    g("image_link", item.imageLink),
    ...item.additionalImageLinks.map((url) => g("additional_image_link", url)),
    g("availability", item.availability),
    g("condition", item.condition),
    g("price", item.price),
    g("sale_price", item.salePrice),
    g("brand", item.brand),
    g("google_product_category", item.googleProductCategory),
    g("product_type", item.productType),
    g("color", item.color),
    g("size", item.size),
    // Sellers rarely have GTINs; without this Google rejects the item.
    g("identifier_exists", "no"),
    // Meta's video field (Google and TikTok ignore it).
    item.videoLink ? `<video><url>${escapeFeedXml(item.videoLink)}</url></video>` : null,
    "</item>",
  ];
  return `${lines.filter(Boolean).join("\n")}\n`;
}

/* ------------------------------------------------------------------------ */
/* CSV                                                                      */
/* ------------------------------------------------------------------------ */

export const FEED_CSV_HEADERS = [
  "id",
  "item_group_id",
  "title",
  "description",
  "availability",
  "condition",
  "price",
  "sale_price",
  "link",
  "image_link",
  "additional_image_link",
  "brand",
  "google_product_category",
  "product_type",
  "color",
  "size",
  "identifier_exists",
  "video[0].url",
] as const;

export function escapeFeedCsv(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** The header row, with a BOM so spreadsheet apps read the Arabic as UTF-8. */
export function feedCsvHeader(): string {
  return `﻿${FEED_CSV_HEADERS.join(",")}\n`;
}

export function feedCsvRow(item: FeedItem): string {
  const cells = [
    item.id,
    item.itemGroupId ?? "",
    item.title,
    item.description,
    item.availability,
    item.condition,
    item.price,
    item.salePrice ?? "",
    item.link,
    item.imageLink,
    item.additionalImageLinks.join(","),
    item.brand,
    item.googleProductCategory ?? "",
    item.productType ?? "",
    item.color ?? "",
    item.size ?? "",
    "no",
    item.videoLink ?? "",
  ];
  return `${cells.map(escapeFeedCsv).join(",")}\n`;
}

/* ------------------------------------------------------------------------ */
/* Request parsing                                                          */
/* ------------------------------------------------------------------------ */

/** `products.xml` / `products.csv` → the format; anything else is not a feed. */
export function parseFeedFile(file: string): FeedFormat | null {
  if (file === "products.xml") return "xml";
  if (file === "products.csv") return "csv";
  return null;
}

/**
 * The feed's language: `?lang=` when the store offers it, else the store's
 * default (its first language; Arabic unless the store is English only).
 */
export function feedLocale(requested: string | null, supportedLocales: readonly string[] | null | undefined): FeedLocale {
  const supported = (supportedLocales ?? []).filter((l): l is FeedLocale => l === "ar" || l === "en");
  const fallback: FeedLocale = supported[0] ?? "ar";
  if (requested === "ar" || requested === "en") return supported.length === 0 || supported.includes(requested) ? requested : fallback;
  return fallback;
}
