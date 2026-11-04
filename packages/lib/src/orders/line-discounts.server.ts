import { and, cartItems, db, eq, inArray, productQuantityOffers, products, productVariants, storeDiscountRules, stores } from "@workspace/db";
import type { OrderDiscountLine } from "@workspace/db";
import { storeSellsProduct } from "../stores/catalog.server";
import { applyDiscountRules, invalidGiftLineIndexes, type DiscountRule, type GiftSnapshot } from "./automatic-discounts.lib";
import { crossSellForCart } from "./cross-sell.server";
import { lineOfferDiscountLines, pickBestLineOffers, type LineOffer } from "./line-discounts.lib";
import { applyQuantityOffers, type QuantityOffer } from "./quantity-offers.lib";

type CartLine = {
  productId: string;
  quantity: number;
  price: string | number;
  variant?: unknown;
  crossSellId?: string | null;
  giftRuleId?: string | null;
};

export type StoreCartDiscounts = {
  /** One per input line, in order; null when the line has no offer. A gift line never has one. */
  lines: Array<LineOffer | null>;
  totalPiastres: number;
  /** Ready for `orders.discounts` and the checkout summary. */
  discountLines: OrderDiscountLine[];
  /** One per input line: the valid gift's snapshot, or null. */
  gifts: Array<GiftSnapshot | null>;
  /** Gift lines that no longer qualify. They are never charged: the order drops them. */
  invalidGiftIndexes: number[];
  /** What the paid lines come to after their offers, before a coupon. */
  netPiastres: number;
  paidUnits: number;
  /** This store's rules that are on, for the cart's gift choices. */
  rules: DiscountRule[];
  sellerId: string | null;
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

/** Whether one gift unit can still be handed over: active, in this store's catalog, in stock. */
export async function giftUnitAvailable(storeId: string, sellerId: string | null, productId: string, variantId: string | null): Promise<boolean> {
  const [product] = await db
    .select({ sellerId: products.sellerId, status: products.status, deletedAt: products.deletedAt, trackStock: products.trackStock, quantity: products.quantity })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!product || product.sellerId !== sellerId || product.status !== "active" || product.deletedAt) return false;
  if (!(await storeSellsProduct(storeId, productId))) return false;
  if (product.trackStock === false) return true;
  if (!variantId) return Number(product.quantity ?? 0) >= 1;
  const [variant] = await db
    .select({ stock: productVariants.stock })
    .from(productVariants)
    .where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId)))
    .limit(1);
  return Number(variant?.stock ?? 0) >= 1;
}

/**
 * What the store's offers take off a cart, read fresh and never cached: it decides
 * money. Every price the customer sees and the order itself come from this one
 * function. Marketplace carts return zeros without a query. Gift lines don't count
 * towards anything: not a tier, a cross-sell, a rule or a gift's own amount.
 */
export async function storeCartDiscounts(
  storeId: string | null | undefined,
  items: readonly CartLine[],
  now: Date = new Date(),
): Promise<StoreCartDiscounts> {
  if (!storeId || items.length === 0) {
    return {
      lines: items.map(() => null),
      totalPiastres: 0,
      discountLines: [],
      gifts: items.map(() => null),
      invalidGiftIndexes: items.flatMap((item, index) => (item.giftRuleId ? [index] : [])),
      netPiastres: 0,
      paidUnits: 0,
      rules: [],
      sellerId: null,
    };
  }
  const paid = items.flatMap((item, index) => (item.giftRuleId ? [] : [{ item, index }]));
  const paidItems = paid.map(({ item }) => item);
  const productIds = [...new Set(paidItems.map((item) => item.productId))];
  const [[store], tierRows, crossSell, ruleRows] = await Promise.all([
    db.select({ sellerId: stores.sellerId }).from(stores).where(eq(stores.id, storeId)).limit(1),
    productIds.length > 0 ? db.select().from(productQuantityOffers).where(inArray(productQuantityOffers.productId, productIds)) : [],
    crossSellForCart(storeId, paidItems),
    db
      .select()
      .from(storeDiscountRules)
      .where(and(eq(storeDiscountRules.storeId, storeId), eq(storeDiscountRules.isActive, true))),
  ]);
  const sellerId = store?.sellerId ?? null;
  const rules = ruleRows.map(toDiscountRule);

  // The seller's own category of each product, only when a rule needs it.
  const categoryByProduct = new Map<string, string | null>();
  if (productIds.length > 0 && rules.some((rule) => rule.ruleType !== "free_gift" && rule.scope === "categories")) {
    const rows = await db.select({ id: products.id, category: products.sellerCategoryId }).from(products).where(inArray(products.id, productIds));
    for (const row of rows) categoryByProduct.set(row.id, row.category);
  }

  const unitPiastres = paidItems.map((item) => Math.round(Number(item.price) * 100));
  const tiers = applyQuantityOffers(
    paidItems.map((item, index) => ({ productId: item.productId, quantity: item.quantity, unitPiastres: unitPiastres[index]! })),
    tierRows.map(toTier),
    sellerId,
  );
  const automatic = applyDiscountRules(
    paidItems.map((item, index) => ({
      productId: item.productId,
      categoryId: categoryByProduct.get(item.productId) ?? null,
      quantity: item.quantity,
      unitPiastres: unitPiastres[index]!,
    })),
    rules,
    { sellerId, storeId },
    now,
  );

  const paidLines = pickBestLineOffers(
    paidItems.map((_, index): Array<LineOffer | null> => {
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
    paidItems.map((item, index) => unitPiastres[index]! * item.quantity),
  );

  const lines: Array<LineOffer | null> = items.map(() => null);
  paid.forEach(({ index }, position) => {
    lines[index] = paidLines[position] ?? null;
  });

  const totalPiastres = paidLines.reduce((sum, line) => sum + (line?.discountPiastres ?? 0), 0);
  const grossPiastres = paidItems.reduce((sum, item, index) => sum + unitPiastres[index]! * item.quantity, 0);
  const netPiastres = grossPiastres - totalPiastres;
  const paidUnits = paidItems.reduce((sum, item) => sum + Math.max(0, item.quantity), 0);

  const giftEntries = items.flatMap((item, index) => (item.giftRuleId ? [{ item, index }] : []));
  const available = await Promise.all(
    giftEntries.map(({ item }) =>
      giftUnitAvailable(storeId, sellerId, item.productId, (item.variant as { id?: string } | null | undefined)?.id ?? null),
    ),
  );
  const invalid = invalidGiftLineIndexes(
    giftEntries.map(({ item }, position) => ({
      ruleId: item.giftRuleId!,
      productId: item.productId,
      quantity: item.quantity,
      available: available[position] === true,
    })),
    rules,
    { sellerId, storeId },
    { netPiastres, paidUnits },
    now,
  );
  const invalidGiftIndexes = invalid.map((position) => giftEntries[position]!.index);
  const gifts: Array<GiftSnapshot | null> = items.map(() => null);
  giftEntries.forEach(({ item, index }) => {
    if (invalidGiftIndexes.includes(index)) return;
    const rule = rules.find((candidate) => candidate.id === item.giftRuleId);
    if (rule) gifts[index] = { ruleId: rule.id, name: rule.name };
  });

  return {
    lines,
    totalPiastres,
    discountLines: lineOfferDiscountLines(paidLines),
    gifts,
    invalidGiftIndexes,
    netPiastres,
    paidUnits,
    rules,
    sellerId,
  };
}

/**
 * Takes gift lines that no longer qualify out of this cart, so what the customer
 * sees is what they get. Placing the order drops them too, whatever happens here.
 * Returns the removed cart item ids.
 */
export async function removeInvalidCartGifts(cart: { id: string; storeId: string | null }): Promise<string[]> {
  const items = await db.select().from(cartItems).where(and(eq(cartItems.cartId, cart.id), eq(cartItems.savedForLater, false)));
  if (!items.some((item) => item.giftRuleId)) return [];
  const { invalidGiftIndexes } = await storeCartDiscounts(cart.storeId, items);
  const ids = invalidGiftIndexes.map((index) => items[index]!.id);
  if (ids.length > 0) await db.delete(cartItems).where(and(eq(cartItems.cartId, cart.id), inArray(cartItems.id, ids)));
  return ids;
}
