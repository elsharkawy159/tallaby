/**
 * "Order again" on a store customer's order page (ROADMAP.md F-01e, store
 * part): which of the order's lines go back in the cart, and how many. Pure.
 *
 * A line comes back only when its product is still active, not trashed, the
 * store's own seller's and in this store's catalog, and (for a variant) the
 * same variant still exists. The quantity is capped by the stock left after
 * what is already in the cart. Prices are never taken from the order: the cart
 * snapshots today's price when the line is added (`addToCart`).
 */

export type ReorderOrderItem = { productId: string; variantId: string | null; quantity: number };

export type ReorderProduct = {
  id: string;
  sellerId: string;
  status: string | null;
  deletedAt: string | null;
  /** Product stock (used when the line has no variant). */
  quantity: number;
  /** Whether this store sells it (catalog all/selected mode). */
  inCatalog: boolean;
  variants: { id: string; stock: number }[];
};

export type ReorderSkipReason = "unavailable" | "outOfStock";

export type ReorderLine = { productId: string; variantId: string | null; quantity: number; requested: number };

export type ReorderPlan = {
  lines: ReorderLine[];
  skipped: { productId: string; variantId: string | null; reason: ReorderSkipReason }[];
  /** Lines added with fewer units than ordered (stock). */
  capped: number;
};

const lineKey = (productId: string, variantId: string | null) => `${productId}:${variantId ?? ""}`;

export function buildReorderLines(
  items: readonly ReorderOrderItem[],
  products: readonly ReorderProduct[],
  {
    sellerId,
    inCart = new Map<string, number>(),
  }: {
    /** The store's seller: lines of anyone else are never added. */
    sellerId: string;
    /** Units already in the shopper's cart, by `reorderCartKey`. */
    inCart?: ReadonlyMap<string, number>;
  },
): ReorderPlan {
  // Same product and variant twice in one order: one line with both quantities.
  const merged = new Map<string, ReorderOrderItem>();
  for (const item of items) {
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (!qty) continue;
    const key = lineKey(item.productId, item.variantId);
    const prev = merged.get(key);
    merged.set(key, { productId: item.productId, variantId: item.variantId, quantity: (prev?.quantity ?? 0) + qty });
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  const plan: ReorderPlan = { lines: [], skipped: [], capped: 0 };
  for (const [key, item] of merged) {
    const product = byId.get(item.productId);
    const skip = (reason: ReorderSkipReason) => plan.skipped.push({ productId: item.productId, variantId: item.variantId, reason });
    if (!product || product.sellerId !== sellerId || product.status !== "active" || product.deletedAt || !product.inCatalog) {
      skip("unavailable");
      continue;
    }
    let stock: number;
    if (item.variantId) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        skip("unavailable");
        continue;
      }
      stock = variant.stock;
    } else {
      // The product has variants now: the shopper has to pick one on its page.
      if (product.variants.length) {
        skip("unavailable");
        continue;
      }
      stock = product.quantity;
    }
    const left = Math.max(0, Math.floor(stock) - (inCart.get(key) ?? 0));
    if (left <= 0) {
      skip("outOfStock");
      continue;
    }
    const quantity = Math.min(item.quantity, left);
    if (quantity < item.quantity) plan.capped += 1;
    plan.lines.push({ productId: item.productId, variantId: item.variantId, quantity, requested: item.quantity });
  }
  return plan;
}

/** The `inCart` key of a cart line (its variant id, if any, from `cart_items.variant.id`). */
export function reorderCartKey(productId: string, variantId: string | null | undefined): string {
  return lineKey(productId, variantId ?? null);
}
