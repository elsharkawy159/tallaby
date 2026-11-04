import { and, db, eq, inArray, productCrossSells, stores } from "@workspace/db";
import { applyCrossSellDiscounts, type CrossSellLineResult, type CrossSellOffer } from "./cross-sell.lib";

function toOffer(row: typeof productCrossSells.$inferSelect): CrossSellOffer {
  return {
    id: row.id,
    sellerId: row.sellerId,
    storeId: row.storeId,
    productId: row.productId,
    offerProductId: row.offerProductId,
    offerVariantId: row.offerVariantId,
    discountType: row.discountType === "fixed" ? "fixed" : "percent",
    discountValue: Number(row.discountValue),
    isActive: row.isActive,
  };
}

type CartLine = {
  productId: string;
  quantity: number;
  price: string | number;
  variant?: unknown;
  crossSellId?: string | null;
};

/**
 * The discount for a store cart, read fresh and never cached: it decides money.
 * Marketplace carts and carts with no offer return zeros without a query.
 */
export async function crossSellForCart(
  storeId: string | null | undefined,
  items: readonly CartLine[],
): Promise<{ lines: CrossSellLineResult[]; totalPiastres: number }> {
  const offerIds = [...new Set(items.flatMap((item) => (item.crossSellId ? [item.crossSellId] : [])))];
  if (!storeId || offerIds.length === 0) {
    return { lines: items.map(() => ({ discountPiastres: 0, snapshot: null })), totalPiastres: 0 };
  }
  const [[store], rows] = await Promise.all([
    db
      .select({ sellerId: stores.sellerId, enabled: stores.crossSellEnabled })
      .from(stores)
      .where(eq(stores.id, storeId))
      .limit(1),
    db.select().from(productCrossSells).where(inArray(productCrossSells.id, offerIds)),
  ]);
  return applyCrossSellDiscounts(
    items.map((item) => ({
      productId: item.productId,
      variantId: (item.variant as { id?: string } | null | undefined)?.id ?? null,
      quantity: item.quantity,
      unitPiastres: Math.round(Number(item.price) * 100),
      crossSellId: item.crossSellId ?? null,
    })),
    rows.map(toOffer),
    { sellerId: store?.sellerId ?? null, storeId, enabled: store?.enabled === true },
  );
}

/** One active offer of this store's seller, checked against the store. Null otherwise. */
export async function findStoreOffer(sellerId: string, storeId: string, offerId: string): Promise<CrossSellOffer | null> {
  const [[row], [store]] = await Promise.all([
    db
      .select()
      .from(productCrossSells)
      .where(and(eq(productCrossSells.id, offerId), eq(productCrossSells.sellerId, sellerId), eq(productCrossSells.isActive, true)))
      .limit(1),
    db.select({ enabled: stores.crossSellEnabled }).from(stores).where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId))).limit(1),
  ]);
  if (!row || !store?.enabled) return null;
  if (row.storeId !== null && row.storeId !== storeId) return null;
  return toOffer(row);
}
