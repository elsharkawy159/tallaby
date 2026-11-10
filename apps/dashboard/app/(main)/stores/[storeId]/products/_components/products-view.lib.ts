// Tabs, search, category filter, sort and paging of the seller products page.
// The filtering runs on the server (products-list.query.ts); these helpers read
// and write the URL that holds it (ROADMAP.md F-43a).

import { storeProductsHref } from "@/lib/products/product-routes.lib";

export type ProductsTab = "all" | "published" | "draft" | "lowStock" | "outOfStock";
export type ProductsSort = "newest" | "priceAsc" | "priceDesc" | "stockAsc" | "name";
export type ProductsViewMode = "grid" | "table";
export type StockLevel = "in" | "low" | "out";

export const PRODUCTS_TABS: ProductsTab[] = ["all", "published", "draft", "lowStock", "outOfStock"];
export const PRODUCTS_SORTS: ProductsSort[] = ["newest", "priceAsc", "priceDesc", "stockAsc", "name"];

export const PRODUCTS_PAGE_SIZES = [20, 50, 100, 200] as const;
export const DEFAULT_PRODUCTS_PAGE_SIZE = 20;
/** Cookie that remembers the seller's chosen page size. */
export const PRODUCTS_PAGE_SIZE_COOKIE = "tl-prod-size";
const SEARCH_MAX_LENGTH = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Below this many units a product counts as low on stock. */
export const LOW_STOCK_THRESHOLD = 10;

/** What the URL asks for. Everything is validated: the URL is user input. */
export type ProductsListFilters = {
  tab: ProductsTab;
  q: string;
  /** A Tallaby category id, or "" for all. */
  category: string;
  sort: ProductsSort;
  page: number;
  size: number;
};

type RawParams = Partial<Record<keyof ProductsListFilters, string | string[] | undefined>>;

const single = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export function parsePageSize(value: string | undefined | null): number | null {
  const size = Number(value);
  return (PRODUCTS_PAGE_SIZES as readonly number[]).includes(size) ? size : null;
}

export function parseProductsFilters(raw: RawParams, sizeFallback?: string | null): ProductsListFilters {
  const tab = single(raw.tab) as ProductsTab;
  const sort = single(raw.sort) as ProductsSort;
  const category = single(raw.category);
  const page = Number(single(raw.page));
  return {
    tab: PRODUCTS_TABS.includes(tab) ? tab : "all",
    q: single(raw.q).trim().slice(0, SEARCH_MAX_LENGTH),
    category: UUID.test(category) ? category : "",
    sort: PRODUCTS_SORTS.includes(sort) ? sort : "newest",
    page: Number.isSafeInteger(page) && page >= 1 ? page : 1,
    size: parsePageSize(single(raw.size)) ?? parsePageSize(sizeFallback) ?? DEFAULT_PRODUCTS_PAGE_SIZE,
  };
}

/** The store's list URL, leaving out defaults so a plain list URL stays plain. */
export function productsListHref(storeId: string, filters: ProductsListFilters): string {
  const params = new URLSearchParams();
  if (filters.tab !== "all") params.set("tab", filters.tab);
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.size !== DEFAULT_PRODUCTS_PAGE_SIZE) params.set("size", String(filters.size));
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return storeProductsHref(storeId, query ? `?${query}` : "");
}

/** Escapes %, _ and backslash so a seller's search text is matched literally by ILIKE. */
export function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

const toNumber = (value: string | number | null | undefined) => {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

export function stockLevel(quantity: number | null | undefined): StockLevel {
  const qty = quantity ?? 0;
  if (qty <= 0) return "out";
  return qty < LOW_STOCK_THRESHOLD ? "low" : "in";
}

type PricedProduct = { basePrice?: string | number | null; salePrice?: string | number | null };

/** The price a buyer pays: the sale price when there is one. */
export function effectivePrice(product: PricedProduct) {
  return toNumber(product.salePrice ?? product.basePrice);
}

/** Whole-percent discount of the sale price off the base price, 0 when none. */
export function discountPercent(product: PricedProduct) {
  const base = toNumber(product.basePrice);
  const sale = toNumber(product.salePrice ?? product.basePrice);
  if (base <= 0 || sale >= base) return 0;
  return Math.round((1 - sale / base) * 100);
}

/** Page numbers with gaps: 1 … 4 5 6 … 12. */
export function pageList(current: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const keep = new Set([1, pages, current - 1, current, current + 1]);
  const out: (number | "gap")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (keep.has(p)) out.push(p);
    else if (out[out.length - 1] !== "gap") out.push("gap");
  }
  return out;
}
