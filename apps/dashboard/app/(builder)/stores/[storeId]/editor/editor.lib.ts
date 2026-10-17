/**
 * Pure editor operations (PLAN.md P4-01/P4-06). No React, no server code:
 * the zustand store calls these, and tests cover them directly.
 */
import type { PageContent, SectionInstance, SiteLocale } from "@workspace/store-sections";
import type {
  AnySectionDefinition,
  CatalogQuery,
  CategorySummary,
  ProductSummary,
} from "@workspace/store-sections/render";
import type { EditorCategory, EditorProduct } from "./editor.data";

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
export function setItemProp(
  instance: SectionInstance,
  collection: string,
  index: number,
  key: string,
  value: unknown,
  target: EditTarget,
): SectionInstance {
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
  const drop = <T,>(list: T[]) => list.filter((_, i) => i !== index);
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
  const move = <T,>(list: T[]) => {
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
    inStock: product.inStock,
  };
}

export function resolveCanvasCatalog(
  queries: Record<string, CatalogQuery>,
  catalog: { products: EditorProduct[]; categories: EditorCategory[] },
  locale: SiteLocale,
): { products: Record<string, ProductSummary[]>; categories: CategorySummary[] } {
  const products: Record<string, ProductSummary[]> = {};
  for (const [instanceId, query] of Object.entries(queries)) {
    if (query.kind !== "products") continue;
    let list = catalog.products;
    if (query.source === "featured") list = list.filter((p) => p.isFeatured);
    if (query.source === "category") list = query.categoryId ? list.filter((p) => p.categoryId === query.categoryId) : [];
    if (query.source === "selected") {
      const byId = new Map(list.map((p) => [p.id, p]));
      list = (query.productIds ?? []).map((id) => byId.get(id)).filter((p): p is EditorProduct => Boolean(p));
    }
    products[instanceId] = list.slice(0, query.limit).map((p) => toSummary(p, locale));
  }
  return {
    products,
    categories: catalog.categories.map((c) => ({
      id: c.id,
      key: c.id,
      name: c.name[locale] || c.name.ar,
      href: "#",
      image: c.image,
      productCount: c.productCount,
    })),
  };
}
