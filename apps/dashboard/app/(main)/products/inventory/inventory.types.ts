import type { MovementReason } from "./inventory.lib";

/** One stock line: a product without variants, or one tracked variant. */
export type InventoryLine = {
  productId: string;
  variantId: string | null;
  title: string;
  variantTitle: string | null;
  image: string | null;
  stock: number;
  threshold: number;
  status: string;
  /** Visitors waiting for a back-in-stock email on this line (0126, F-23a). */
  waiting: number;
};

export type StockMovementRow = {
  id: string;
  variantId: string | null;
  variantTitle: string | null;
  delta: number;
  stockAfter: number;
  reason: MovementReason;
  orderId: string | null;
  orderNumber: string | null;
  /** True when the change was made by the seller's own account. */
  bySeller: boolean;
  createdAt: string;
};

export type ProductInventory = {
  productId: string;
  title: string;
  lines: InventoryLine[];
  history: StockMovementRow[];
};
