/**
 * Quantity offers (ROADMAP.md F-07). Pure and in integer piastres. The same code
 * prices the cart, the checkout summary and the order, so the price shown is the
 * price charged. A line's price stays full; the discount comes out of its total.
 */

export type QuantityOfferType = "percent" | "fixed";

export type QuantityOffer = {
  id: string;
  sellerId: string;
  productId: string;
  minQuantity: number;
  discountType: QuantityOfferType;
  discountValue: number;
  isActive: boolean;
};

export type QuantityOfferLine = {
  productId: string;
  quantity: number;
  /** Unit price in piastres. */
  unitPiastres: number;
};

export type QuantityOfferSnapshot = {
  offerId: string;
  minQuantity: number;
  discountType: QuantityOfferType;
  discountValue: number;
  unitDiscountPiastres: number;
  units: number;
};

export type QuantityOfferLineResult = { discountPiastres: number; snapshot: QuantityOfferSnapshot | null };

export const QUANTITY_OFFER_LABEL = "Quantity offer";
export const QUANTITY_OFFER_MIN_QUANTITY = 2;
export const QUANTITY_OFFER_MAX_QUANTITY = 1000;
export const QUANTITY_OFFER_MIN_PERCENT = 1;
export const QUANTITY_OFFER_MAX_PERCENT = 90;
export const QUANTITY_OFFER_MAX_TIERS = 6;

/** What one unit loses. A unit never reaches 0, even when a cheaper variant meets a fixed amount. */
export function quantityOfferUnitDiscountPiastres(unitPiastres: number, type: QuantityOfferType, value: number): number {
  if (!Number.isFinite(unitPiastres) || unitPiastres <= 1 || !Number.isFinite(value) || value <= 0) return 0;
  const discount =
    type === "percent"
      ? Math.round((unitPiastres * Math.min(value, QUANTITY_OFFER_MAX_PERCENT)) / 100)
      : Math.round(value * 100);
  return Math.min(discount, unitPiastres - 1);
}

/** The highest active tier this many units reach, or null. */
export function pickQuantityTier<T extends Pick<QuantityOffer, "minQuantity" | "isActive">>(tiers: readonly T[], units: number): T | null {
  let best: T | null = null;
  for (const tier of tiers) {
    if (!tier.isActive || tier.minQuantity > units) continue;
    if (!best || tier.minQuantity > best.minQuantity) best = tier;
  }
  return best;
}

/**
 * One result per line, in order. Units count across a product's variants, and the
 * tier covers every unit. Only tiers of the store's own seller count: the caller
 * passes rows as they are, so a row from another seller is ignored here.
 */
export function applyQuantityOffers(
  lines: readonly QuantityOfferLine[],
  offers: readonly QuantityOffer[],
  sellerId: string | null,
): { lines: QuantityOfferLineResult[]; totalPiastres: number } {
  const none: QuantityOfferLineResult = { discountPiastres: 0, snapshot: null };
  if (!sellerId || offers.length === 0) return { lines: lines.map(() => none), totalPiastres: 0 };

  const unitsByProduct = new Map<string, number>();
  for (const line of lines) unitsByProduct.set(line.productId, (unitsByProduct.get(line.productId) ?? 0) + Math.max(0, line.quantity));

  let totalPiastres = 0;
  const results = lines.map((line): QuantityOfferLineResult => {
    const own = offers.filter((offer) => offer.productId === line.productId && offer.sellerId === sellerId);
    const tier = pickQuantityTier(own, unitsByProduct.get(line.productId) ?? 0);
    if (!tier) return none;
    const unitDiscountPiastres = quantityOfferUnitDiscountPiastres(line.unitPiastres, tier.discountType, tier.discountValue);
    const discountPiastres = unitDiscountPiastres * Math.max(0, line.quantity);
    if (discountPiastres <= 0) return none;
    totalPiastres += discountPiastres;
    return {
      discountPiastres,
      snapshot: {
        offerId: tier.id,
        minQuantity: tier.minQuantity,
        discountType: tier.discountType,
        discountValue: tier.discountValue,
        unitDiscountPiastres,
        units: line.quantity,
      },
    };
  });
  return { lines: results, totalPiastres };
}

export type QuantityTierInput = { minQuantity: number; discountType: QuantityOfferType; discountValue: number; isActive: boolean };

export type QuantityTiersError = "tooMany" | "quantity" | "ascending" | "percent" | "fixed";

/**
 * The tiers a seller typed, cleaned, or why not: quantities ascending from 2, 1 to
 * 90 percent, or a fixed amount below the lowest price this product sells at.
 */
export function parseQuantityTiers(
  input: unknown,
  lowestPricePiastres: number,
): { ok: true; tiers: QuantityTierInput[] } | { ok: false; error: QuantityTiersError } {
  if (!Array.isArray(input) || input.length > QUANTITY_OFFER_MAX_TIERS) return { ok: false, error: "tooMany" };
  const tiers: QuantityTierInput[] = [];
  for (const raw of input as Array<Record<string, unknown>>) {
    const minQuantity = Number(raw?.minQuantity);
    if (!Number.isInteger(minQuantity) || minQuantity < QUANTITY_OFFER_MIN_QUANTITY || minQuantity > QUANTITY_OFFER_MAX_QUANTITY) {
      return { ok: false, error: "quantity" };
    }
    const previous = tiers[tiers.length - 1];
    if (previous && minQuantity <= previous.minQuantity) return { ok: false, error: "ascending" };

    const discountType: QuantityOfferType = raw?.discountType === "fixed" ? "fixed" : "percent";
    const discountValue = Math.round(Number(raw?.discountValue) * 100) / 100;
    if (discountType === "percent") {
      if (!Number.isFinite(discountValue) || discountValue < QUANTITY_OFFER_MIN_PERCENT || discountValue > QUANTITY_OFFER_MAX_PERCENT) {
        return { ok: false, error: "percent" };
      }
    } else if (!Number.isFinite(discountValue) || discountValue <= 0 || Math.round(discountValue * 100) >= lowestPricePiastres) {
      return { ok: false, error: "fixed" };
    }
    tiers.push({ minQuantity, discountType, discountValue, isActive: raw?.isActive !== false });
  }
  return { ok: true, tiers };
}
