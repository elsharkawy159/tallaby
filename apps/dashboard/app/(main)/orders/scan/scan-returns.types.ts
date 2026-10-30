import type { SellerOrderStage } from "../order-flow.lib";

/** What Orders › Scan returns shows for a found order (ROADMAP.md F-04e). */
export interface ScannedOrder {
  id: string;
  orderNumber: string;
  createdAt: string | null;
  stage: SellerOrderStage;
  customerName: string | null;
  customerPhone: string | null;
  itemsSummary: string;
  itemCount: number;
  /** Sum of this seller's lines. */
  total: string;
  storeName: string | null;
  /** The existing "Mark returned" step (updateSellerOrder, action "return") is open right now. */
  canReturn: boolean;
  /** Why the seller cannot change this order (orders.errors.readOnly.*), if so. */
  readOnly: "multi_seller" | "tallaby" | "digital" | null;
  /** Bosta moves this shipment itself. */
  carrierManaged: boolean;
}

export type ScanLookupResult =
  | { ok: true; order: ScannedOrder }
  | { ok: false; error: "invalid" | "notFound" | "unauthorized" | "generic" };
