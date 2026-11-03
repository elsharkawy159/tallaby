import {
  and,
  asc,
  categories as categoriesTable,
  db,
  desc,
  eq,
  exists,
  ilike,
  inArray,
  isNull,
  or,
  productTranslations,
  products,
  sql,
} from "@workspace/db";
import type { SQL } from "drizzle-orm";
import { parsePriceJson } from "@workspace/lib";
import { richTextToPlainText } from "@workspace/tiptap/plain-text";
import {
  LOW_STOCK_THRESHOLD,
  PRODUCTS_TABS,
  likePattern,
  type ProductsListFilters,
  type ProductsSort,
  type ProductsTab,
} from "./products-view.lib";
import type { VendorProduct } from "./vendor-products.section";

/**
 * The seller products list, on the server (ROADMAP.md F-43a). Every query is
 * scoped to the session seller's id passed in by the caller and leaves out
 * Trash (0123). Products are one account catalog, so nothing here takes a store.
 */

export type ListFilters = Pick<ProductsListFilters, "tab" | "q" | "category" | "sort">;
export type ProductsCategoryOption = { id: string; name: string };

const baseConditions = (sellerId: string) => [eq(products.sellerId, sellerId), isNull(products.deletedAt)];

/** The same tab rules as stockLevel(): out at 0 or below, low under the threshold. Unlimited stock (0138) is neither. */
function tabCondition(tab: ProductsTab): SQL | undefined {
  switch (tab) {
    case "published":
      return eq(products.status, "active");
    case "draft":
      return sql`${products.status} <> 'active'`;
    case "lowStock":
      return sql`${products.trackStock} AND ${products.quantity} > 0 AND ${products.quantity} < ${LOW_STOCK_THRESHOLD}`;
    case "outOfStock":
      return sql`${products.trackStock} AND ${products.quantity} <= 0`;
    default:
      return undefined;
  }
}

function filterConditions(sellerId: string, filters: ListFilters): SQL {
  const conditions: (SQL | undefined)[] = [...baseConditions(sellerId), tabCondition(filters.tab)];
  if (filters.category) conditions.push(eq(products.categoryId, filters.category));
  if (filters.q) {
    const pattern = likePattern(filters.q);
    // A title in either language, or the SKU.
    conditions.push(
      or(
        ilike(products.sku, pattern),
        exists(
          db
            .select({ one: sql`1` })
            .from(productTranslations)
            .where(and(eq(productTranslations.productId, products.id), ilike(productTranslations.title, pattern))),
        ),
      ),
    );
  }
  return and(...conditions)!;
}

const numericOrNull = (text: SQL) => sql`CASE WHEN ${text} ~ '^-?[0-9]+(\\.[0-9]+)?$' THEN (${text})::numeric END`;

/** The price a buyer pays, read the way parsePriceJson reads products.price. */
const buyerPrice = sql`COALESCE(CASE jsonb_typeof(${products.price})
  WHEN 'object' THEN COALESCE(
    ${numericOrNull(sql`${products.price}->>'final'`)},
    ${numericOrNull(sql`${products.price}->>'current'`)},
    ${numericOrNull(sql`${products.price}->>'list'`)},
    ${numericOrNull(sql`${products.price}->>'base'`)}
  )
  WHEN 'number' THEN (${products.price}#>>'{}')::numeric
  WHEN 'string' THEN ${numericOrNull(sql`${products.price}#>>'{}'`)}
END, 0)`;

function sortOrder(sort: ProductsSort, locale: string): SQL[] {
  // created_at can repeat (bulk imports), so the id keeps paging stable.
  const newest = [sql`${products.createdAt} DESC NULLS LAST`, desc(products.id)];
  switch (sort) {
    case "priceAsc":
      return [asc(buyerPrice), ...newest];
    case "priceDesc":
      return [desc(buyerPrice), ...newest];
    case "stockAsc":
      // Unlimited stock (0138) has no count: last.
      return [sql`CASE WHEN ${products.trackStock} THEN ${products.quantity} END ASC NULLS LAST`, ...newest];
    case "name": {
      // The title the list shows: this language first, then the other one.
      const language = locale.startsWith("ar") ? "ar" : "en";
      const title = sql`(
        SELECT t.title FROM ${productTranslations} t
        WHERE t.product_id = ${products.id}
        ORDER BY (t.locale = ${language}) DESC
        LIMIT 1
      )`;
      return [sql`${title} ASC NULLS LAST`, ...newest];
    }
    default:
      return newest;
  }
}

type LoadedProduct = Awaited<ReturnType<typeof loadProductsByIds>>[number];

async function loadProductsByIds(sellerId: string, ids: string[], withDescription: boolean) {
  if (ids.length === 0) return [];
  return db.query.products.findMany({
    where: and(inArray(products.id, ids), ...baseConditions(sellerId)),
    columns: {
      id: true,
      sku: true,
      images: true,
      status: true,
      condition: true,
      isFeatured: true,
      quantity: true,
      trackStock: true,
      price: true,
      averageRating: true,
      reviewCount: true,
    },
    with: {
      brand: { columns: { name: true } },
      category: { columns: { name: true, nameAr: true } },
      productTranslations: {
        columns: { locale: true, title: true, slug: true, description: withDescription },
      },
    },
  });
}

function toVendorProduct(p: LoadedProduct, isArabic: boolean): Omit<VendorProduct, "storeUrl"> {
  const translations: { locale: string; title: string; slug?: string | null; description?: string | null }[] =
    p.productTranslations ?? [];
  const en = translations.find((t) => t.locale === "en");
  const ar = translations.find((t) => t.locale === "ar");
  // Name, description and category follow the dashboard language, falling back
  // to the other language when the product has only one.
  const [preferred, fallback] = isArabic ? [ar, en] : [en, ar];
  const slug = (en?.slug ?? ar?.slug ?? "").trim() || null;
  // `products.price` is jsonb; parsePriceJson normalises it like the storefront.
  const price = parsePriceJson(p.price);
  return {
    id: p.id,
    title: preferred?.title || fallback?.title || "",
    slug,
    sku: p.sku,
    // Only loaded for the Excel export; never a column.
    description: richTextToPlainText(preferred?.description ?? fallback?.description) || null,
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    status: p.status ?? "pending",
    condition: p.condition ?? null,
    isFeatured: p.isFeatured ?? false,
    quantity: Number(p.quantity) || 0,
    trackStock: p.trackStock,
    basePrice: price.base,
    salePrice: price.final,
    brand: p.brand ? { name: p.brand.name } : null,
    category: p.category
      ? { name: (isArabic ? p.category.nameAr || p.category.name : p.category.name || p.category.nameAr) ?? null }
      : null,
    averageRating: p.averageRating ?? null,
    reviewCount: p.reviewCount ?? 0,
  };
}

/** Ids in list order, for one page or (no paging) for every filtered product. */
async function selectIds(
  sellerId: string,
  filters: ListFilters,
  locale: string,
  paging?: { limit: number; offset: number },
): Promise<string[]> {
  const query = db
    .select({ id: products.id })
    .from(products)
    .where(filterConditions(sellerId, filters))
    .orderBy(...sortOrder(filters.sort, locale))
    .$dynamic();
  const rows = await (paging ? query.limit(paging.limit).offset(paging.offset) : query);
  return rows.map((r) => r.id);
}

async function loadInOrder(sellerId: string, ids: string[], locale: string, withDescription: boolean) {
  const rows = await loadProductsByIds(sellerId, ids, withDescription);
  const byId = new Map(rows.map((p) => [p.id, p]));
  const isArabic = locale.startsWith("ar");
  return ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [toVendorProduct(row, isArabic)] : [];
  });
}

/** One page of the list, its filtered total, and the page actually used. */
export async function listSellerProductsPage(sellerId: string, filters: ProductsListFilters, locale: string) {
  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(filterConditions(sellerId, filters));
  const total = countRows[0]?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / filters.size));
  // A deleted last row or an old link can point past the end.
  const page = Math.min(filters.page, pages);
  const ids = await selectIds(sellerId, filters, locale, { limit: filters.size, offset: (page - 1) * filters.size });
  return { products: await loadInOrder(sellerId, ids, locale, false), total, page, pages };
}

/** Every filtered product with its description: the Excel export. */
export async function listSellerProductsForExport(sellerId: string, filters: ListFilters, locale: string) {
  const ids = await selectIds(sellerId, filters, locale);
  return loadInOrder(sellerId, ids, locale, true);
}

/** Every filtered product id: "select all" and "update from Excel". */
export function listSellerProductIds(sellerId: string, filters: ListFilters, locale: string) {
  return selectIds(sellerId, filters, locale);
}

/** Tab counts ignore the search and category, as the tabs always have. */
export async function countSellerProductsByTab(sellerId: string): Promise<Record<ProductsTab, number>> {
  const [row] = await db
    .select({
      all: sql<number>`count(*)::int`,
      published: sql<number>`count(*) FILTER (WHERE ${tabCondition("published")})::int`,
      draft: sql<number>`count(*) FILTER (WHERE ${tabCondition("draft")})::int`,
      lowStock: sql<number>`count(*) FILTER (WHERE ${tabCondition("lowStock")})::int`,
      outOfStock: sql<number>`count(*) FILTER (WHERE ${tabCondition("outOfStock")})::int`,
    })
    .from(products)
    .where(and(...baseConditions(sellerId)));
  return Object.fromEntries(PRODUCTS_TABS.map((tab) => [tab, row?.[tab] ?? 0])) as Record<ProductsTab, number>;
}

/** The categories the seller's products are in, sorted for the language. */
export async function listSellerProductCategories(sellerId: string, locale: string): Promise<ProductsCategoryOption[]> {
  const isArabic = locale.startsWith("ar");
  const rows = await db
    .selectDistinct({ id: categoriesTable.id, name: categoriesTable.name, nameAr: categoriesTable.nameAr })
    .from(products)
    .innerJoin(categoriesTable, eq(categoriesTable.id, products.categoryId))
    .where(and(...baseConditions(sellerId)));
  return rows
    .map((c) => ({ id: c.id, name: (isArabic ? c.nameAr || c.name : c.name || c.nameAr) ?? "" }))
    .filter((c) => c.name)
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

/** Id and status of the seller's own products among these ids. Others are dropped. */
export async function loadOwnProductStatuses(sellerId: string, ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select({ id: products.id, status: products.status })
    .from(products)
    .where(and(inArray(products.id, ids), ...baseConditions(sellerId)));
}

/** Light product options for the ad picker: no variants or descriptions. */
export async function listSellerProductOptions(sellerId: string, locale: string) {
  // One title (this language, then English, then any) and one photo: all the picker shows.
  // Nested SQL: in a one-table select drizzle strips the table name from a field's
  // top-level columns, and a bare "id" would mean the translation's id in there.
  return db
    .select({
      id: products.id,
      price: products.price,
      status: products.status,
      image: sql<string | null>`${products.images}->>0`,
      title: sql<string | null>`${sql`(
        SELECT t.title FROM ${productTranslations} t
        WHERE t.product_id = ${products.id}
        ORDER BY (t.locale = ${locale}) DESC, (t.locale = 'en') DESC
        LIMIT 1
      )`}`,
    })
    .from(products)
    .where(and(...baseConditions(sellerId)))
    .orderBy(desc(products.createdAt));
}
