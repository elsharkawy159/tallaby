import type { OrderDiscountLine, OrderDiscountType } from "@workspace/db";
import { formatDecimal } from "./place-order.lib";
import { CROSS_SELL_LABEL } from "./cross-sell.lib";
import { QUANTITY_OFFER_LABEL } from "./quantity-offers.lib";

/**
 * One line offer per line (docs/superpowers/specs/2026-11-04-quantity-offers-design.md §3, §8).
 * A line takes the single biggest discount it qualifies for; they never add up.
 * A coupon then applies to what is left. Pure and in integer piastres.
 */

export type LineOfferKind = Extract<OrderDiscountType, "quantity_offer" | "cross_sell" | "automatic_discount">;

export type LineOffer = {
  kind: LineOfferKind;
  discountPiastres: number;
  /** Merged into `order_items.metadata` under its own key. */
  metadata: Record<string, unknown>;
  /** The rule's own name, for an automatic discount. */
  label?: string;
};

const LABELS: Partial<Record<LineOfferKind, string>> = {
  quantity_offer: QUANTITY_OFFER_LABEL,
  cross_sell: CROSS_SELL_LABEL,
};

/**
 * The biggest offer of each line. Candidates are per line, in priority order, so
 * a tie goes to the earlier one. A discount never takes a line below zero.
 */
export function pickBestLineOffers(
  candidates: ReadonlyArray<ReadonlyArray<LineOffer | null>>,
  lineTotalsPiastres: readonly number[],
): Array<LineOffer | null> {
  return candidates.map((offers, index) => {
    let best: LineOffer | null = null;
    for (const offer of offers) {
      if (!offer || offer.discountPiastres <= 0) continue;
      if (!best || offer.discountPiastres > best.discountPiastres) best = offer;
    }
    if (!best) return null;
    const cap = Math.max(0, lineTotalsPiastres[index] ?? 0);
    return best.discountPiastres > cap ? { ...best, discountPiastres: cap } : best;
  });
}

/** The lines for `orders.discounts`: one per kind, and one per rule for automatic discounts. */
export function lineOfferDiscountLines(lines: ReadonlyArray<LineOffer | null>): OrderDiscountLine[] {
  const groups = new Map<string, { type: LineOfferKind; label: string; piastres: number }>();
  const order: LineOfferKind[] = ["quantity_offer", "cross_sell", "automatic_discount"];
  for (const kind of order) {
    for (const line of lines) {
      if (line?.kind !== kind || line.discountPiastres <= 0) continue;
      const label = line.label ?? LABELS[kind] ?? kind;
      const key = `${kind}:${label}`;
      const group = groups.get(key) ?? { type: kind, label, piastres: 0 };
      group.piastres += line.discountPiastres;
      groups.set(key, group);
    }
  }
  return [...groups.values()].map((group) => ({ type: group.type, label: group.label, amount: formatDecimal(group.piastres / 100) }));
}
