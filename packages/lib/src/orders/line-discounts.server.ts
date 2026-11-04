import { and, db, eq, inArray, productQuantityOffers, products, storeDiscountRules, stores } from "@workspace/db";
import type { OrderDiscountLine } from "@workspace/db";
import { applyDiscountRules, type DiscountRule } from "./automatic-discounts.lib";
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

export function toDiscountRule(row: typeof storeDiscountRules.$inferSelect): DiscountRule {
  return {
    id: row.id,
    sellerId: row.sellerId,
    storeId: row.storeId,
    name: row.name,
    ruleType: row.ruleType === "buy_x_get_y" || row.ruleType === "free_gift" ? row.ruleType : "percent_off",
    scope: row.scope === "categories" ? "categories" : "all",
    categoryIds: row.categoryIds ?? [],
    discountPercent: row.discountPercent === null ? null : Number(row.discountPercent),
    buyQuantity: row.buyQuantity,
    getQuantity: row.getQuantity,
    minSubtotalPiastres: row.minSubtotal === null ? null : Math.round(Number(row.minSubtotal) * 100),
    giftProductIds: row.giftProductIds ?? [],
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    isActive: row.isActive,
  };
}

/**
 * What the store's offers take off a cart, read fresh and never cached: it decides
 * money. Every price the customer sees and the order itself come from this one
 * function. Marketplace carts return zeros without a query.
 */
export async function storeCartDiscounts(
  storeId: string | null | undefined,
  items: readonly CartLine[],
  now: Date = new Date(),
): Promise<StoreCartDiscounts> {
  if (!storeId || items.length === 0) {
    return { lines: items.map(() => null), totalPiastres: 0, discountLines: [] };
  }
  const productIds = [...new Set(items.map((item) => item.productId))];
  const [[store], tierRows, crossSell, ruleRows] = await Promise.all([
    db.select({ sellerId: stores.sellerId }).from(stores).where(eq(stores.id, storeId)).limit(1),
    db.select().from(productQuantityOffers).where(inArray(productQuantityOffers.productId, productIds)),
    crossSellForCart(storeId, items),
    db
      .select()
      .from(storeDiscountRules)
      .where(and(eq(storeDiscountRules.storeId, storeId), eq(storeDiscountRules.isActive, true))),
  ]);
  const sellerId = store?.sellerId ?? null;
  const rules = ruleRows.map(toDiscountRule);

  // The seller's own category of each product, only when a rule needs it.
  const categoryByProduct = new Map<string, string | null>();
  if (rules.some((rule) => rule.scope === "categories")) {
    const rows = await db.select({ id: products.id, category: products.sellerCategoryId }).from(products).where(inArray(products.id, productIds));
    for (const row of rows) categoryByProduct.set(row.id, row.category);
  }

  const unitPiastres = items.map((item) => Math.round(Number(item.price) * 100));
  const tiers = applyQuantityOffers(
    items.map((item, index) => ({ productId: item.productId, quantity: item.quantity, unitPiastres: unitPiastres[index]! })),
    tierRows.map(toTier),
    sellerId,
  );
  const automatic = applyDiscountRules(
    items.map((item, index) => ({
      productId: item.productId,
      categoryId: categoryByProduct.get(item.productId) ?? null,
      quantity: item.quantity,
      unitPiastres: unitPiastres[index]!,
    })),
    rules,
    { sellerId, storeId },
    now,
  );

  const lines = pickBestLineOffers(
    items.map((_, index): Array<LineOffer | null> => {
      const tier = tiers.lines[index];
      const offer = crossSell.lines[index];
      const rule = automatic[index];
      return [
        tier?.snapshot ? { kind: "quantity_offer", discountPiastres: tier.discountPiastres, metadata: { quantityOffer: tier.snapshot } } : null,
        offer?.snapshot ? { kind: "cross_sell", discountPiastres: offer.discountPiastres, metadata: { crossSell: offer.snapshot } } : null,
        rule
          ? { kind: "automatic_discount", discountPiastres: rule.discountPiastres, metadata: { automaticDiscount: rule.snapshot }, label: rule.snapshot.name }
          : null,
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
