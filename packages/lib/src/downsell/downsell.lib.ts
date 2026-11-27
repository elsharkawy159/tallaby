import { z } from "zod";

/**
 * Downsell (ROADMAP.md F-116, owner 2026-11-27): when a shopper tries to leave
 * a store website's checkout without ordering, show ONE offer the seller
 * picked for a product in the cart: a cheaper product of the same store, or
 * one of the store's coupons. Pure: shared by the dashboard and the storefront.
 * No price or discount math lives here; the cart and coupon code apply the offer.
 */

/** The App Center id; installed = on (`store_app_installs`). */
export const DOWNSELL_APP = "downsell";

/** Most offers one store can keep (one per product). */
export const DOWNSELL_LIMIT = 200;

const uuid = z.uuid();

export const downsellOfferSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("product"), productId: uuid }),
  z.strictObject({ kind: z.literal("coupon"), couponId: uuid }),
]);
export type DownsellOffer = z.infer<typeof downsellOfferSchema>;

/** What the dashboard sends to save one product's offer. */
export const downsellSaveSchema = z.strictObject({ productId: uuid, offer: downsellOfferSchema });
export type DownsellSaveInput = z.infer<typeof downsellSaveSchema>;

/** A cheaper product is strictly below the price it replaces (both in piastres or cents). */
export function isCheaperPrice(offerMinor: number, mainMinor: number): boolean {
  return Number.isFinite(offerMinor) && Number.isFinite(mainMinor) && offerMinor > 0 && offerMinor < mainMinor;
}

/**
 * The cart line the checkout offers a downsell for: the first line, in cart
 * order, whose product has an offer. A product offer is kept only while it is
 * cheaper than that line's unit price, so a sale on the main product can't
 * turn the swap into a price rise.
 */
export function pickDownsellLine<L extends { productId: string; unitMinor: number }, O extends { kind: "product"; unitMinor: number } | { kind: "coupon" }>(
  lines: readonly L[],
  offers: ReadonlyMap<string, O>,
): { line: L; offer: O } | null {
  for (const line of lines) {
    const offer = offers.get(line.productId);
    if (!offer) continue;
    if (offer.kind === "product" && !isCheaperPrice(offer.unitMinor, line.unitMinor)) continue;
    return { line, offer };
  }
  return null;
}
