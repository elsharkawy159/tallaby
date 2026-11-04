/**
 * Cross-sell offers (ROADMAP.md F-32). Pure and in integer piastres. The same
 * function prices the checkout summary and the order, so the price shown is the
 * price charged. A line's price stays full; the discount comes out of its total.
 */

export type CrossSellOffer = {
  id: string;
  sellerId: string;
  storeId: string | null;
  productId: string;
  offerProductId: string;
  offerVariantId: string | null;
  discountType: "percent" | "fixed";
  discountValue: number;
  isActive: boolean;
};

export type CrossSellLine = {
  productId: string;
  variantId: string | null;
  quantity: number;
  /** Unit price in piastres. */
  unitPiastres: number;
  crossSellId: string | null;
};

export type CrossSellSnapshot = {
  offerId: string;
  mainProductId: string;
  discountType: "percent" | "fixed";
  discountValue: number;
  unitDiscountPiastres: number;
  discountedUnits: number;
};

export type CrossSellLineResult = { discountPiastres: number; snapshot: CrossSellSnapshot | null };

export const CROSS_SELL_LABEL = "Bundle offer";
export const CROSS_SELL_DEFAULT_PERCENT = 10;
export const CROSS_SELL_MAX_PERCENT = 90;

/** What one unit loses. A unit never reaches 0, so an offer is never a free gift. */
export function crossSellUnitDiscountPiastres(unitPiastres: number, type: "percent" | "fixed", value: number): number {
  if (!Number.isFinite(unitPiastres) || unitPiastres <= 1 || !Number.isFinite(value) || value <= 0) return 0;
  const discount =
    type === "percent"
      ? Math.round((unitPiastres * Math.min(value, CROSS_SELL_MAX_PERCENT)) / 100)
      : Math.round(value * 100);
  return Math.min(discount, unitPiastres - 1);
}

/**
 * One result per line, in order. A line qualifies only when it carries an active
 * offer of this store's seller, the store has offers on, the offer points at this
 * product and variant, and the main product is in the same order. One discounted
 * unit per main unit.
 */
export function applyCrossSellDiscounts(
  lines: readonly CrossSellLine[],
  offers: readonly CrossSellOffer[],
  store: { sellerId: string | null; storeId: string | null; enabled: boolean },
): { lines: CrossSellLineResult[]; totalPiastres: number } {
  const none: CrossSellLineResult = { discountPiastres: 0, snapshot: null };
  if (!store.enabled || !store.sellerId || !lines.some((line) => line.crossSellId)) {
    return { lines: lines.map(() => none), totalPiastres: 0 };
  }
  const byId = new Map(offers.map((offer) => [offer.id, offer]));
  const mainQuantity = new Map<string, number>();
  for (const line of lines) mainQuantity.set(line.productId, (mainQuantity.get(line.productId) ?? 0) + line.quantity);

  let totalPiastres = 0;
  const results = lines.map((line): CrossSellLineResult => {
    const offer = line.crossSellId ? byId.get(line.crossSellId) : undefined;
    if (
      !offer ||
      !offer.isActive ||
      offer.sellerId !== store.sellerId ||
      (offer.storeId !== null && offer.storeId !== store.storeId) ||
      offer.offerProductId !== line.productId ||
      (offer.offerVariantId !== null && offer.offerVariantId !== line.variantId)
    ) {
      return none;
    }
    const discountedUnits = Math.min(line.quantity, mainQuantity.get(offer.productId) ?? 0);
    const unitDiscountPiastres = crossSellUnitDiscountPiastres(line.unitPiastres, offer.discountType, offer.discountValue);
    const discountPiastres = discountedUnits * unitDiscountPiastres;
    if (discountPiastres <= 0) return none;
    totalPiastres += discountPiastres;
    return {
      discountPiastres,
      snapshot: {
        offerId: offer.id,
        mainProductId: offer.productId,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        unitDiscountPiastres,
        discountedUnits,
      },
    };
  });
  return { lines: results, totalPiastres };
}

/** The input a seller typed, cleaned, or null. */
export function parseCrossSellDiscount(type: unknown, value: unknown): { type: "percent" | "fixed"; value: number } | null {
  if (type !== "percent" && type !== "fixed") return null;
  const amount = Math.round(Number(value) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return null;
  if (type === "percent" && (amount < 1 || amount > CROSS_SELL_MAX_PERCENT)) return null;
  return { type, value: amount };
}
