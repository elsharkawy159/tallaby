import { db, eq, inArray, productQuantityOffers, stores } from "@workspace/db";
import type { OrderDiscountLine } from "@workspace/db";
import { crossSellForCart } from "./cross-sell.server";
import { lineOfferDiscountLines, pickBestLineOffers, type LineOffer } from "./line-discounts.lib";
import { applyQuantityOffers, type QuantityOffer } from "./quantity-offers.lib";

type CartLine = {
  productId: string;
  quantity: number;
  price: string | number;
  variant?: unknown;
  crossSellId?: string | null;
};

export type StoreCartDiscounts = {
  /** One per input line, in order; null when the line has no offer. */
  lines: Array<LineOffer | null>;
  totalPiastres: number;
  /** Ready for `orders.discounts` and the checkout summary. */
  discountLines: OrderDiscountLine[];
};

function toTier(row: typeof productQuantityOffers.$inferSelect): QuantityOffer {
  return {
    id: row.id,
    sellerId: row.sellerId,
    productId: row.productId,
    minQuantity: row.minQuantity,
    discountType: row.discountType === "fixed" ? "fixed" : "percent",
    discountValue: Number(row.discountValue),
    isActive: row.isActive,
  };
}

/**
 * What the store's offers take off a cart, read fresh and never cached: it decides
 * money. Every price the customer sees and the order itself come from this one
 * function. Marketplace carts return zeros without a query.
 */
export async function storeCartDiscounts(storeId: string | null | undefined, items: readonly CartLine[]): Promise<StoreCartDiscounts> {
  if (!storeId || items.length === 0) {
    return { lines: items.map(() => null), totalPiastres: 0, discountLines: [] };
  }
  const productIds = [...new Set(items.map((item) => item.productId))];
  const [[store], tierRows, crossSell] = await Promise.all([
    db.select({ sellerId: stores.sellerId }).from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select().from(productQuantityOffers).where(inArray(productQuantityOffers.productId, productIds)),
    crossSellForCart(storeId, items),
  ]);

  const unitPiastres = items.map((item) => Math.round(Number(item.price) * 100));
  const tiers = applyQuantityOffers(
    items.map((item, index) => ({ productId: item.productId, quantity: item.quantity, unitPiastres: unitPiastres[index]! })),
    tierRows.map(toTier),
    store?.sellerId ?? null,
  );

  const lines = pickBestLineOffers(
    items.map((_, index): Array<LineOffer | null> => {
      const tier = tiers.lines[index];
      const offer = crossSell.lines[index];
      return [
        tier?.snapshot ? { kind: "quantity_offer", discountPiastres: tier.discountPiastres, metadata: { quantityOffer: tier.snapshot } } : null,
        offer?.snapshot ? { kind: "cross_sell", discountPiastres: offer.discountPiastres, metadata: { crossSell: offer.snapshot } } : null,
      ];
    }),
    items.map((item, index) => unitPiastres[index]! * item.quantity),
  );

  return {
    lines,
    totalPiastres: lines.reduce((sum, line) => sum + (line?.discountPiastres ?? 0), 0),
    discountLines: lineOfferDiscountLines(lines),
  };
}
