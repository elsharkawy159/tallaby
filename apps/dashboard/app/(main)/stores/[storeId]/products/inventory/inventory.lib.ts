/**
 * Products › Inventory (ROADMAP.md F-10c, migration 0125). Pure helpers shared
 * by the data loader, the restock action and the page.
 */

/** Same default as the store badge (0122) and the low_stock bell trigger (0125). */
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;
/** The most units one quick restock may add. */
export const MAX_RESTOCK = 100_000;
/** Rows of history shown for one product. */
export const HISTORY_LIMIT = 100;
/** Low-stock rows listed at most. */
export const LOW_STOCK_LIMIT = 300;

export const MOVEMENT_REASONS = ["order", "cancel", "return", "edit", "bulk_edit", "import", "other"] as const;
export type MovementReason = (typeof MOVEMENT_REASONS)[number];

export function lowStockThreshold(value: number | null | undefined): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 99 ? value : DEFAULT_LOW_STOCK_THRESHOLD;
}

export type StockLevel = "out" | "low" | "ok";

export function stockLevel(stock: number, threshold: number): StockLevel {
  if (stock <= 0) return "out";
  return stock <= threshold ? "low" : "ok";
}

export function movementReason(value: unknown): MovementReason {
  return typeof value === "string" && (MOVEMENT_REASONS as readonly string[]).includes(value) ? (value as MovementReason) : "other";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export type RestockInput = { productId: string; variantId: string | null; add: number };

/** Validates a quick-restock request from the client; null when invalid. */
export function parseRestockInput(input: unknown): RestockInput | null {
  if (!input || typeof input !== "object") return null;
  const { productId, variantId, add } = input as Record<string, unknown>;
  if (!isUuid(productId)) return null;
  if (variantId !== null && variantId !== undefined && !isUuid(variantId)) return null;
  if (typeof add !== "number" || !Number.isInteger(add) || add < 1 || add > MAX_RESTOCK) return null;
  return { productId: productId.toLowerCase(), variantId: variantId ? variantId.toLowerCase() : null, add };
}

/** The `?product=` search param, when it is a valid id. */
export function selectedProductParam(value: string | string[] | undefined): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return isUuid(v) ? v.toLowerCase() : null;
}
