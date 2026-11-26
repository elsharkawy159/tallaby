import type { PriceRoundingRule } from "@workspace/lib/products/price-rounding";
import { roundPricePayload, roundVariantPriceRow } from "@workspace/lib/products/price-rounding/payload";
import { loadStorePriceRounding } from "@workspace/lib/products/price-rounding/server";
import type { ProductStoreContext } from "./product-store.server";

/**
 * Round product prices on save (ROADMAP.md F-112b) for the dashboard's
 * product writers (actions/products.ts, bulk edit, Excel update, the file
 * import). The rule is the checked store's (`requireProductStore`: the
 * session's seller owns it; after the catalog split a product's
 * `products.store_id` is that store), read from the DB once per request.
 */

export type { PriceRoundingRule };
export { roundPricePayload, roundVariantPriceRow };

/** The rule of the store a product write was checked against; null = prices are saved as entered. */
export function loadProductStoreRounding(
  ctx: Pick<ProductStoreContext, "seller" | "store">,
): Promise<PriceRoundingRule | null> {
  return loadStorePriceRounding(ctx.seller.sellerId, ctx.store.id);
}

/**
 * The rule a bulk caller loaded once for its whole batch (with
 * {@link loadStorePriceRounding}; server code only, never a client value),
 * else the store's rule read now. `undefined` = none was loaded.
 */
export async function resolveProductStoreRounding(
  ctx: Pick<ProductStoreContext, "seller" | "store">,
  preloaded: PriceRoundingRule | null | undefined,
): Promise<PriceRoundingRule | null> {
  return preloaded !== undefined ? preloaded : loadProductStoreRounding(ctx);
}

export { loadStorePriceRounding };
