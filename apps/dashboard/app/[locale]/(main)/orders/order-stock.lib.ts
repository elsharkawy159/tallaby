import type { SellerOrderAction, SellerOrderStage } from "./order-flow.lib";

/**
 * Whether an order's items are on the shelf, and what a status change does to
 * the stock (ROADMAP.md F-42a). An order takes its stock when placed. Cancelling
 * puts it back, and a return puts it back only if the seller says so, because
 * returned items can be damaged. `orders.metadata.returnRestockedAt` records
 * that choice, so a later status change can't take or add the stock twice.
 */

const RETURN_RESTOCKED_KEY = "returnRestockedAt";
export { RETURN_RESTOCKED_KEY };

export function isReturnRestocked(metadata: unknown): boolean {
  return Boolean(
    metadata &&
      typeof metadata === "object" &&
      (metadata as Record<string, unknown>)[RETURN_RESTOCKED_KEY],
  );
}

export function isStockOnShelf(stage: SellerOrderStage, metadata: unknown): boolean {
  if (stage === "cancelled") return true;
  return stage === "returned" && isReturnRestocked(metadata);
}

export type StockMove = "take" | "restore" | "none";

export function resolveStockMove(input: {
  stockOnShelf: boolean;
  action: SellerOrderAction;
  /** The seller's "back in stock" choice; only "return" reads it. */
  restock?: boolean;
}): StockMove {
  const staysOnShelf = input.action === "cancel" || (input.action === "return" && Boolean(input.restock));
  if (input.stockOnShelf === staysOnShelf) return "none";
  return staysOnShelf ? "restore" : "take";
}

/** Whether the seller can still put a returned order's items back in stock. */
export function canRestockReturn(stage: SellerOrderStage, metadata: unknown, readOnly: boolean): boolean {
  return stage === "returned" && !readOnly && !isReturnRestocked(metadata);
}
