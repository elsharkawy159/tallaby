/**
 * The minimum a customer must buy of one product in one order (0151). Pure, so
 * the product page, the cart, the manual order form and `placeOrderFromCart`
 * share one rule. A product's normal lines are summed across its variants: 2 red
 * and 1 blue meet a minimum of 3. A free gift never counts, and neither does a
 * cross-sell line whose offer applies.
 */

export const MIN_ORDER_QUANTITY_DEFAULT = 1;
export const MIN_ORDER_QUANTITY_MAX = 10_000;

/** A missing or bad value (an old cached row, say) means no minimum. */
export function normalizeMinOrderQuantity(value: unknown): number {
  if (value === null || value === undefined || value === "") return MIN_ORDER_QUANTITY_DEFAULT;
  const minimum = Number(value);
  return Number.isInteger(minimum) && minimum >= 1 ? minimum : MIN_ORDER_QUANTITY_DEFAULT;
}

export type MinOrderLine = {
  productId: string;
  quantity: number;
  minOrderQuantity?: unknown;
  giftRuleId?: string | null;
  crossSellId?: string | null;
  savedForLater?: boolean | null;
};

export type MinOrderShortfall = { productId: string; minimum: number; current: number; missing: number };

/**
 * One entry per product under its minimum. `isExempt` decides on cross-sell lines:
 * only the caller knows whether the offer still applies. Without it a line counts
 * as a normal one, unless it is a gift.
 */
export function minOrderShortfalls<T extends MinOrderLine>(
  lines: readonly T[],
  { isExempt }: { isExempt?: (line: T) => boolean } = {},
): MinOrderShortfall[] {
  const byProduct = new Map<string, { minimum: number; current: number }>();
  for (const line of lines) {
    if (line.savedForLater || line.giftRuleId || isExempt?.(line)) continue;
    const entry = byProduct.get(line.productId);
    if (entry) entry.current += Math.max(0, line.quantity);
    else byProduct.set(line.productId, { minimum: normalizeMinOrderQuantity(line.minOrderQuantity), current: Math.max(0, line.quantity) });
  }
  const shortfalls: MinOrderShortfall[] = [];
  for (const [productId, { minimum, current }] of byProduct) {
    if (current < minimum) shortfalls.push({ productId, minimum, current, missing: minimum - current });
  }
  return shortfalls;
}

/** What can be bought of a product at all: Infinity when untracked, else its variants' total or its own count. */
export function availableUnits(input: {
  trackStock?: boolean | null;
  productQuantity?: unknown;
  variantStocks?: readonly unknown[] | null;
}): number {
  if (input.trackStock === false) return Number.POSITIVE_INFINITY;
  const variants = input.variantStocks ?? [];
  const total = variants.length
    ? variants.reduce<number>((sum, stock) => sum + Math.max(0, Number(stock ?? 0) || 0), 0)
    : Number(input.productQuantity ?? 0) || 0;
  return Math.max(0, total);
}

/** A cart line that takes no part: a gift, a cross-sell line or one saved for later. */
const isOutsideMinimum = (line: MinOrderLine) => Boolean(line.giftRuleId || line.crossSellId || line.savedForLater);

/** Units of this product on the cart's normal lines, other than `except`. */
export function normalUnitsInCart<T extends MinOrderLine>(productId: string, lines: readonly T[], except?: (line: T) => boolean): number {
  return lines.reduce(
    (sum, line) => (line.productId === productId && !isOutsideMinimum(line) && !except?.(line) ? sum + Math.max(0, line.quantity) : sum),
    0,
  );
}

/** The lowest this line can go while the product still meets its minimum. Removing the line is always allowed. */
export function cartLineFloor<T extends MinOrderLine>(line: T, lines: readonly T[]): number {
  if (isOutsideMinimum(line)) return 1;
  return Math.max(1, normalizeMinOrderQuantity(line.minOrderQuantity) - normalUnitsInCart(line.productId, lines, (other) => other === line));
}

/** Going down below the floor is refused. Removing, or moving an old line up towards the minimum, is not. */
export function isQuantityChangeRefused<T extends MinOrderLine>(line: T, next: number, lines: readonly T[]): boolean {
  if (next <= 0 || next >= line.quantity) return false;
  return next < cartLineFloor(line, lines);
}

/**
 * What to add so the product reaches its minimum: a card's single unit becomes
 * the minimum. It stops at this line's stock (another variant can make up the
 * rest) and never lowers what was asked for.
 */
export function addQuantityForMinimum(input: { requested: number; minimum: number; unitsInCart: number; lineAvailable: number }): number {
  const needed = input.minimum - input.unitsInCart;
  if (needed <= input.requested) return input.requested;
  return Math.max(input.requested, Math.min(needed, input.lineAvailable));
}

/** The product page's lowest quantity: what's still needed, up to the selected variant's stock. */
export function productPageFloor(input: { minimum: number; otherUnits: number; stock: number }): number {
  return Math.max(1, Math.min(input.minimum - input.otherUnits, input.stock));
}

/**
 * Only a seller's manual order can go under the minimum, and only when the seller
 * chose to. An order taken outside Tallaby already happened, so it is never refused.
 * The flag means nothing on a customer's order.
 */
export function shouldEnforceMinOrder(orderSource: "website" | "external" | "storefront" | "manual", allowBelowMinimum: boolean | undefined): boolean {
  if (orderSource === "external") return false;
  if (orderSource === "manual") return allowBelowMinimum !== true;
  return true;
}
