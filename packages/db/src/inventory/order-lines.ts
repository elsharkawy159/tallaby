import type { StockLine } from "./stock";

/**
 * Which stock an order line moves (product bundles, 0188, ROADMAP.md F-07f;
 * docs/plans/bundles.md §2). Pure, so checkout and every restore path share one
 * rule.
 *
 * A normal line moves its own product or variant. A bundle line holds no stock
 * itself: it moves each item of its snapshot (`order_items.bundle_items`),
 * times the line's quantity. Restores read the order's snapshot, never the
 * bundle's current items, so an edited bundle still restores what was sold.
 */

/** One stock line of an order: the product, its variant (null = the product's own stock) and how many. */
export interface OrderStockLine {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export interface OrderLineInput {
  productId: string;
  variantId: string | null;
  quantity: number;
  /** `order_items.bundle_items` (or the cart's computed snapshot); anything else = not a bundle line. */
  bundleItems?: unknown;
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** The snapshot's valid items, or null when there is no usable snapshot. Bad rows are dropped. */
function snapshotItems(bundleItems: unknown): OrderStockLine[] | null {
  if (!Array.isArray(bundleItems)) return null;
  const items: OrderStockLine[] = [];
  for (const raw of bundleItems) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    if (!nonEmptyString(row.productId) || !isPositiveInt(row.quantity)) continue;
    const variantId = row.variantId == null ? null : nonEmptyString(row.variantId) ? row.variantId : undefined;
    if (variantId === undefined) continue;
    items.push({ productId: row.productId, variantId, quantity: row.quantity });
  }
  return items.length > 0 ? items : null;
}

/**
 * The stock lines one order line moves. Without a valid snapshot this is
 * exactly today's single line `[{ productId, variantId, quantity }]`; a bundle
 * line gives each snapshot item × the line's quantity.
 */
export function orderLineStockLines(line: OrderLineInput): OrderStockLine[] {
  const items = snapshotItems(line.bundleItems);
  if (!items) return [{ productId: line.productId, variantId: line.variantId, quantity: line.quantity }];
  return items.map((item) => ({ ...item, quantity: item.quantity * line.quantity }));
}

/** Merges equal (productId, variantId) lines by summing quantity; first-seen order is kept. */
export function mergeStockLines(lines: readonly OrderStockLine[]): OrderStockLine[] {
  const merged = new Map<string, OrderStockLine>();
  for (const line of lines) {
    const key = `${line.productId}:${line.variantId ?? ""}`;
    const prev = merged.get(key);
    if (prev) prev.quantity += line.quantity;
    else merged.set(key, { ...line });
  }
  return [...merged.values()];
}

/** The `decrementStock` / `restoreStock` lines: a variant's own stock, else the product's. */
export function toStockLines(lines: readonly OrderStockLine[]): StockLine[] {
  return lines.map((line) =>
    line.variantId
      ? { kind: "variant" as const, id: line.variantId, quantity: line.quantity }
      : { kind: "product" as const, id: line.productId, quantity: line.quantity }
  );
}

/**
 * The `decrementStock` / `restoreStock` lines of a whole order (or cart). With
 * no bundle line this is exactly the old one-line-per-row map, unmerged, so a
 * non-bundle order moves stock as it always did. With a bundle line, every
 * line is expanded and equal rows are merged (a normal line and a bundle item
 * of the same variant become one line).
 */
export function orderStockLinesOf(lines: readonly OrderLineInput[]): StockLine[] {
  const expanded = lines.flatMap(orderLineStockLines);
  const hasBundle = lines.some((line) => snapshotItems(line.bundleItems) !== null);
  return toStockLines(hasBundle ? mergeStockLines(expanded) : expanded);
}

/**
 * Which order line a stock result came from (`StockResult.id` is the variant id,
 * else the product id): the line that moves that row itself, else the first
 * bundle line whose snapshot holds it. `productId` is the product whose stock
 * moved (for a bundle item, the item's own product). Null = no line moved it.
 */
export function stockResultSource<T extends OrderLineInput>(
  lines: readonly T[],
  stockId: string
): { line: T; productId: string; bundleItem: boolean } | null {
  const own = lines.find((line) => (line.variantId ?? line.productId) === stockId);
  if (own) return { line: own, productId: own.productId, bundleItem: false };
  for (const line of lines) {
    const item = snapshotItems(line.bundleItems)?.find((i) => (i.variantId ?? i.productId) === stockId);
    if (item) return { line, productId: item.productId, bundleItem: true };
  }
  return null;
}
