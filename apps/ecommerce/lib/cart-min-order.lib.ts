import { cartLineFloor, minOrderShortfalls, normalizeMinOrderQuantity } from "@workspace/lib/orders/min-order-quantity";

/**
 * The seller's minimum (0151) on the shape cart lines have in the store: the value
 * sits on the line's product. The rule itself is in `@workspace/lib`.
 */
type CartLineItem = {
  id: string;
  productId: string;
  quantity: number;
  giftRuleId?: string | null;
  crossSellId?: string | null;
  savedForLater?: boolean | null;
  product?: { minOrderQuantity?: unknown; title?: string | null } | null;
};

const toLine = <T extends CartLineItem>(item: T) => ({ ...item, minOrderQuantity: item.product?.minOrderQuantity });

/** The lowest this line can go. 1 when it has no minimum, or is a gift or a cross-sell line. */
export function cartItemFloor(item: CartLineItem, items: readonly CartLineItem[]): number {
  const lines = items.map(toLine);
  const self = lines.find((line) => line.id === item.id);
  return self ? cartLineFloor(self, lines) : 1;
}

/** The minimum to state on this line, or null when it has none. */
export function cartItemMinimum(item: CartLineItem): number | null {
  if (item.giftRuleId || item.crossSellId) return null;
  const minimum = normalizeMinOrderQuantity(item.product?.minOrderQuantity);
  return minimum > 1 ? minimum : null;
}

export type CartMinOrderIssue = {
  productId: string;
  title: string;
  minimum: number;
  current: number;
  missing: number;
  /** The line "Add N" raises. */
  lineId: string;
  lineQuantity: number;
};

/**
 * What the checkout asks the customer to fix. `crossSellLineIds` come from the
 * server: only a line whose offer really applies stays outside the minimum, as the
 * order itself decides.
 */
export function cartMinOrderIssues(items: readonly CartLineItem[], crossSellLineIds: readonly string[]): CartMinOrderIssue[] {
  const shortfalls = minOrderShortfalls(items.map(toLine), { isExempt: (line) => crossSellLineIds.includes(line.id) });
  return shortfalls.flatMap((shortfall) => {
    const line = items.find((item) => item.productId === shortfall.productId && !item.giftRuleId && !crossSellLineIds.includes(item.id));
    return line ? [{ ...shortfall, title: line.product?.title?.trim() ?? "", lineId: line.id, lineQuantity: line.quantity }] : [];
  });
}
