/**
 * Pure editor operations (PLAN.md P4-01/P4-06). No React, no server code:
 * the zustand store calls these, and tests cover them directly.
 */
import type { PageContent, SectionInstance, SiteLocale } from "@workspace/store-sections";
import {
  selectProducts,
  type AnySectionDefinition,
  type CatalogQuery,
  type ContentItemSummary,
  type ContentQuery,
  type CouponSummary,
  type ProductSummary,
  type RenderContext,
  type ReviewSummary,
} from "@workspace/store-sections/render";
import type { RatingStats } from "@workspace/lib/store-sites/catalog-data.lib";
import type { EditorBrand, EditorCategory, EditorCoupon, EditorProduct, EditorReview } from "../server/editor.data";

export const MAX_HISTORY = 50;

let counter = 0;
/** Section/item ids: short, unique, valid for the schema (`[A-Za-z0-9_:-]`). */
export function newId(prefix = "s"): string {
  counter = (counter + 1) % 1_000_000;
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}${random}`;
}

export function createInstance(definition: AnySectionDefinition): SectionInstance {
  return {
    id: newId(),
    sectionId: definition.id,
    version: definition.version,
    props: structuredClone(definition.defaultProps) as Record<string, unknown>,
  };
}

type Registered = Readonly<Record<string, number>>;

const isRegistered = (instance: SectionInstance, allowed: Registered) => {
  const max = allowed[instance.sectionId];
  return max !== undefined && instance.version <= max;
};

/**
 * Removes sections the registry no longer has (the coded sections removed by
 * CLAUDE.md rule 17). The canvas cannot draw them and every save rejects them,
 * so a page holding one could never be saved. Returns which pages and chrome
 * parts changed, so the editor marks them unsaved and the next save stores the
 * cleaned drafts.
 */
export function dropUnknownSections<P extends { id: string; content: PageContent }>(
  input: { pages: P[]; header: SectionInstance | null; footer: SectionInstance | null },
  allowed: Registered,
): {
  pages: P[];
  header: SectionInstance | null;
  footer: SectionInstance | null;
  dirtyPages: Record<string, true>;
  dirtyChrome: { header?: true; footer?: true };
  dropped: number;
} {
  let dropped = 0;
  const dirtyPages: Record<string, true> = {};
  const pages = input.pages.map((page) => {
    const sections = page.content.sections.filter((s) => isRegistered(s, allowed));
    if (sections.length === page.content.sections.length) return page;
    dropped += page.content.sections.length - sections.length;
    dirtyPages[page.id] = true;
    return { ...page, content: { ...page.content, sections } };
  });
  const dirtyChrome: { header?: true; footer?: true } = {};
  const chrome = (part: "header" | "footer") => {
    const value = input[part];
    if (!value || isRegistered(value, allowed)) return value;
    dropped += 1;
    dirtyChrome[part] = true;
    return null;
  };
  return { pages, header: chrome("header"), footer: chrome("footer"), dirtyPages, dirtyChrome, dropped };
}

export function insertSection(content: PageContent, instance: SectionInstance, index = content.sections.length): PageContent {
  const sections = [...content.sections];
  sections.splice(Math.max(0, Math.min(index, sections.length)), 0, instance);
  return { ...content, sections };
}

export function moveSection(content: PageContent, from: number, to: number): PageContent {
  if (from === to || from < 0 || from >= content.sections.length) return content;
  const sections = [...content.sections];
  const [moved] = sections.splice(from, 1);
  sections.splice(Math.max(0, Math.min(to, sections.length)), 0, moved!);
  return { ...content, sections };
}

export function removeSection(content: PageContent, id: string): PageContent {
  return { ...content, sections: content.sections.filter((s) => s.id !== id) };
}

export function duplicateSection(content: PageContent, id: string): { content: PageContent; newId: string | null } {
  const index = content.sections.findIndex((s) => s.id === id);
  if (index < 0) return { content, newId: null };
  const copy = { ...structuredClone(content.sections[index]!), id: newId() };
  return { content: insertSection(content, copy, index + 1), newId: copy.id };
}

export function updateSection(content: PageContent, id: string, update: (instance: SectionInstance) => SectionInstance): PageContent {
  return { ...content, sections: content.sections.map((s) => (s.id === id ? update(s) : s)) };
}

type EditTarget = { locale: SiteLocale; defaultLocale: SiteLocale; translatable?: boolean };

/**
 * Sets one prop. In the default locale (Arabic) it writes `props`; in another
 * locale a translatable prop goes to `translations[locale]`, so the Arabic
 * content stays intact (reference overlay model).
 */
export function setSectionProp(instance: SectionInstance, key: string, value: unknown, target: EditTarget): SectionInstance {
  if (target.locale === target.defaultLocale || !target.translatable) {
    return { ...instance, props: { ...instance.props, [key]: value } };
  }
  const overlay = { ...(instance.translations?.[target.locale] ?? {}), [key]: value };
  return { ...instance, translations: { ...(instance.translations ?? {}), [target.locale]: overlay } };
}

function itemsOf(record: Record<string, unknown> | undefined, key: string): Record<string, unknown>[] {
  const value = record?.[key];
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

/** Sets one field of one item of a collection (same locale rule as `setSectionProp`). */
export function setItemProp(instance: SectionInstance, collection: string, index: number, key: string, value: unknown, target: EditTarget): SectionInstance {
  if (target.locale === target.defaultLocale || !target.translatable) {
    const items = itemsOf(instance.props, collection).map((item, i) => (i === index ? { ...item, [key]: value } : item));
    return { ...instance, props: { ...instance.props, [collection]: items } };
  }
  const base = itemsOf(instance.props, collection);
  const current = itemsOf(instance.translations?.[target.locale], collection);
  const overlayItems = base.map((_, i) => ({ ...(current[i] ?? {}), ...(i === index ? { [key]: value } : {}) }));
  const overlay = { ...(instance.translations?.[target.locale] ?? {}), [collection]: overlayItems };
  return { ...instance, translations: { ...(instance.translations ?? {}), [target.locale]: overlay } };
}

/** Structural item edits always change the base list; overlays keep matching by index. */
export function addItem(instance: SectionInstance, collection: string, item: Record<string, unknown>, max = Infinity): SectionInstance {
  const items = itemsOf(instance.props, collection);
  if (items.length >= max) return instance;
  return { ...instance, props: { ...instance.props, [collection]: [...items, item] } };
}

export function removeItem(instance: SectionInstance, collection: string, index: number): SectionInstance {
  const drop = <T>(list: T[]) => list.filter((_, i) => i !== index);
  const translations = instance.translations
    ? Object.fromEntries(
        Object.entries(instance.translations).map(([locale, overlay]) => {
          const list = itemsOf(overlay, collection);
          return [locale, list.length ? { ...overlay, [collection]: drop(list) } : overlay];
        }),
      )
    : undefined;
  return {
    ...instance,
    props: { ...instance.props, [collection]: drop(itemsOf(instance.props, collection)) },
    ...(translations && { translations }),
  };
}

export function moveItem(instance: SectionInstance, collection: string, from: number, to: number): SectionInstance {
  const move = <T>(list: T[]) => {
    if (from < 0 || from >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(Math.max(0, Math.min(to, next.length)), 0, item as T);
    return next;
  };
  const translations = instance.translations
    ? Object.fromEntries(
        Object.entries(instance.translations).map(([locale, overlay]) => {
          const list = itemsOf(overlay, collection);
          return [locale, list.length ? { ...overlay, [collection]: move(list) } : overlay];
        }),
      )
    : undefined;
  return {
    ...instance,
    props: { ...instance.props, [collection]: move(itemsOf(instance.props, collection)) },
    ...(translations && { translations }),
  };
}

/** What the inspector shows for a field in `locale` (overlay value, else base). */
export function readProp(instance: SectionInstance, key: string, target: EditTarget): unknown {
  if (target.locale !== target.defaultLocale && target.translatable) {
    const overlay = instance.translations?.[target.locale]?.[key];
    if (overlay !== undefined) return overlay;
  }
  return instance.props[key];
}

export function readItemProp(instance: SectionInstance, collection: string, index: number, key: string, target: EditTarget): unknown {
  if (target.locale !== target.defaultLocale && target.translatable) {
    const overlay = itemsOf(instance.translations?.[target.locale], collection)[index]?.[key];
    if (overlay !== undefined) return overlay;
  }
  return itemsOf(instance.props, collection)[index]?.[key];
}

// ---------------------------------------------------------------------------
// Canvas catalog: the same answers the storefront resolver gives, from the
// seller's products loaded with the editor.
// ---------------------------------------------------------------------------

function toSummary(product: EditorProduct, locale: SiteLocale): ProductSummary {
  return {
    id: product.id,
    title: product.title[locale] || product.title.ar || product.title.en,
    href: `/products/${product.slug}`,
    image: product.image,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    rating: product.rating ?? null,
    inStock: product.inStock,
  };
}

/** What the canvas loaded besides products and categories (P4B-05); every list may be missing. */
/** Post lists on the canvas: the store's newest published posts, per list (same order as the storefront). */
export function resolveCanvasContent(
  queries: Record<string, ContentQuery>,
  posts: readonly ContentItemSummary[] | null | undefined,
): NonNullable<RenderContext["content"]> {
  const items: Record<string, ContentItemSummary[]> = {};
  for (const [key, query] of Object.entries(queries)) {
    if (query.collection === "blog") items[key] = (posts ?? []).slice(0, query.limit);
  }
  return { items };
}

export type CanvasStoreData = {
  brands?: EditorBrand[] | null;
  reviews?: EditorReview[] | null;
  reviewStats?: RatingStats | null;
  coupons?: EditorCoupon[] | null;
};

/**
 * The catalog the canvas renders, answered like the storefront resolver:
 * products through the shared `selectProducts` rule (same sources, sorts and
 * limits), the store's categories, and brands, reviews and live coupons.
 */
export function resolveCanvasCatalog(
  queries: Record<string, CatalogQuery>,
  catalog: { products: EditorProduct[]; categories: EditorCategory[] } & CanvasStoreData,
  locale: SiteLocale,
): RenderContext["catalog"] {
  const products: Record<string, ProductSummary[]> = {};
  const reviews: Record<string, ReviewSummary[]> = {};
  const coupons: Record<string, CouponSummary> = {};
  const name = (value: { ar: string; en: string }) => value[locale] || value.ar || value.en;
  for (const [instanceId, query] of Object.entries(queries)) {
    if (query.kind === "products") {
      products[instanceId] = selectProducts(query, catalog.products).map((p) => toSummary(p, locale));
    } else if (query.kind === "reviews") {
      reviews[instanceId] = (catalog.reviews ?? [])
        .filter((r) => !query.minRating || r.rating >= query.minRating)
        .slice(0, query.limit)
        .map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          authorName: r.authorName,
          verified: r.verified,
          productTitle: name(r.productTitle) || null,
          productHref: "#",
          createdAt: r.createdAt,
        }));
    } else if (query.kind === "coupon") {
      const coupon = catalog.coupons?.find((c) => c.id === query.couponId && c.live);
      if (coupon) {
        coupons[coupon.id] = {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          endsAt: coupon.endsAt,
        };
      }
    }
  }
  return {
    products,
    categories: catalog.categories.map((c) => ({
      id: c.id,
      key: c.id,
      name: name(c.name),
      href: "#",
      image: c.image,
      productCount: c.productCount,
    })),
    ...(catalog.brands && { brands: catalog.brands.map((b) => ({ id: b.id, name: name(b.name), logo: b.logo, href: null })) }),
    reviews,
    ...(catalog.reviewStats !== undefined && { reviewStats: catalog.reviewStats }),
    coupons,
  };
}
