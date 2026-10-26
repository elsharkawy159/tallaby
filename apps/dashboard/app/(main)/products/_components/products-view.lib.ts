// Client-side tabs, search, category filter and sort for the seller products
// page. The page loads every product of the seller, so this runs in memory.

export type ProductsTab = "all" | "published" | "draft" | "lowStock" | "outOfStock";
export type ProductsSort = "newest" | "priceAsc" | "priceDesc" | "stockAsc" | "name";
export type ProductsViewMode = "grid" | "table";
export type StockLevel = "in" | "low" | "out";

export const PRODUCTS_TABS: ProductsTab[] = ["all", "published", "draft", "lowStock", "outOfStock"];
export const PRODUCTS_SORTS: ProductsSort[] = ["newest", "priceAsc", "priceDesc", "stockAsc", "name"];

/** Below this many units a product counts as low on stock. */
export const LOW_STOCK_THRESHOLD = 10;

export type ViewableProduct = {
  id: string;
  title: string;
  sku?: string | null;
  status: "draft" | "pending" | "active" | "rejected";
  quantity?: number | null;
  basePrice?: string | number | null;
  salePrice?: string | number | null;
  category?: { name: string | null } | null;
};

const toNumber = (value: string | number | null | undefined) => {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

export function stockLevel(quantity: number | null | undefined): StockLevel {
  const qty = quantity ?? 0;
  if (qty <= 0) return "out";
  return qty < LOW_STOCK_THRESHOLD ? "low" : "in";
}

/** The price a buyer pays: the sale price when there is one. */
export function effectivePrice(product: Pick<ViewableProduct, "basePrice" | "salePrice">) {
  return toNumber(product.salePrice ?? product.basePrice);
}

/** Whole-percent discount of the sale price off the base price, 0 when none. */
export function discountPercent(product: Pick<ViewableProduct, "basePrice" | "salePrice">) {
  const base = toNumber(product.basePrice);
  const sale = toNumber(product.salePrice ?? product.basePrice);
  if (base <= 0 || sale >= base) return 0;
  return Math.round((1 - sale / base) * 100);
}

export function matchesTab(product: ViewableProduct, tab: ProductsTab) {
  switch (tab) {
    case "published":
      return product.status === "active";
    case "draft":
      return product.status !== "active";
    case "lowStock":
      return stockLevel(product.quantity) === "low";
    case "outOfStock":
      return stockLevel(product.quantity) === "out";
    default:
      return true;
  }
}

export function countByTab(products: ViewableProduct[]): Record<ProductsTab, number> {
  return Object.fromEntries(
    PRODUCTS_TABS.map((tab) => [tab, products.filter((p) => matchesTab(p, tab)).length])
  ) as Record<ProductsTab, number>;
}

/** Distinct category names, sorted for the locale. */
export function categoryOptions(products: ViewableProduct[], locale: string) {
  const names = new Set<string>();
  for (const p of products) if (p.category?.name) names.add(p.category.name);
  return [...names].sort((a, b) => a.localeCompare(b, locale));
}

export function filterProducts<T extends ViewableProduct>(
  products: T[],
  opts: { tab: ProductsTab; query: string; category: string; sort: ProductsSort; locale: string }
): T[] {
  const query = opts.query.trim().toLowerCase();
  const rows = products.filter(
    (p) =>
      matchesTab(p, opts.tab) &&
      (!opts.category || p.category?.name === opts.category) &&
      (!query ||
        p.title.toLowerCase().includes(query) ||
        (p.sku ?? "").toLowerCase().includes(query))
  );

  // `products` arrives newest first, so "newest" keeps that order.
  if (opts.sort === "newest") return rows;
  const compare: Record<Exclude<ProductsSort, "newest">, (a: T, b: T) => number> = {
    priceAsc: (a, b) => effectivePrice(a) - effectivePrice(b),
    priceDesc: (a, b) => effectivePrice(b) - effectivePrice(a),
    stockAsc: (a, b) => (a.quantity ?? 0) - (b.quantity ?? 0),
    name: (a, b) => a.title.localeCompare(b.title, opts.locale),
  };
  return [...rows].sort(compare[opts.sort]);
}
