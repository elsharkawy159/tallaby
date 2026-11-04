/**
 * Offer lines are stored in English on `orders.discounts`; the customer reads
 * them in their language. Every other line keeps its stored label.
 */
const OFFER_LABEL_KEYS: Record<string, string> = {
  cross_sell: "offerLines.crossSell",
  quantity_offer: "offerLines.quantityOffer",
};

export function orderDiscountLabel(line: { type: string; label: string }, t: (key: never) => string): string {
  const key = OFFER_LABEL_KEYS[line.type];
  return key ? t(key as never) : line.label;
}
