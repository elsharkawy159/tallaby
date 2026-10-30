import type { OrderRisk } from "@workspace/lib/customers";
import type { SellerOrderFlow } from "./order-flow.lib";

export interface SellerOrderLine {
  /** order_items.id */
  id: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  price: string;
  total: string;
  image: string | null;
  /** The product page on the store's own site (custom domain or subdomain). */
  productUrl: string | null;
}

export interface SellerOrderAddress {
  fullName: string | null;
  phone: string | null;
  line: string;
  area: string;
  country: string | null;
  instructions: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface SellerOrderBosta {
  /** null until Bosta accepted the delivery. */
  trackingNumber: string | null;
  stateCode: number | null;
  state: string | null;
  /** A create call is in flight. */
  creating: boolean;
  needsAttention: boolean;
  /** "<reason>: <Bosta message>" from the last failed attempt or exception. */
  lastError: string | null;
  lastSyncedAt: string | null;
}

/** One order on /orders, with only this seller's lines. */
export interface SellerOrderRow {
  /** orders.id */
  id: string;
  orderNumber: string;
  createdAt: string;
  /** null = Tallaby marketplace order; otherwise the store it was placed on. */
  storeId: string | null;
  storeName: string | null;
  customerName: string;
  customerPhone: string | null;
  /** The seller blocked this phone on the order's store (ROADMAP.md F-02). */
  customerBlocked: boolean;
  /** The phone refused orders on this store before, or ordered again within minutes (ROADMAP.md F-02d); null when neither. */
  risk: OrderRisk | null;
  customerEmail: string | null;
  isGuest: boolean;
  address: SellerOrderAddress | null;
  notes: string | null;
  giftMessage: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  subtotal: string;
  shippingCost: string;
  discountAmount: string;
  /** What the customer pays for the whole order. */
  totalAmount: string;
  lines: SellerOrderLine[];
  itemCount: number;
  failureReason: string | null;
  riderName: string | null;
  /** The order was placed on a store with Bosta connected, so "Ship with Bosta" applies (BS-08). */
  bostaConnected: boolean;
  /** That store sends orders to Bosta when the seller confirms them (BS-09). */
  bostaAutoShip: boolean;
  /** The seller says that store's Bosta key has Full access, so a shipment can be cancelled before pickup (BS-12). */
  bostaCanCancel: boolean;
  /** The order's Bosta shipment, once one was attempted. */
  bosta: SellerOrderBosta | null;
  /** The order's store has Wassalha (Egypt Post) set up, so it can be exported for it (F-12c). */
  wassalhaConnected: boolean;
  /** The order is already in a Wassalha sheet (its shipment carrier is `wassalha`). */
  wassalhaExported: boolean;
  flow: SellerOrderFlow;
  /** Prefilled WhatsApp "please confirm" text for a new store order (ROADMAP.md F-02g). */
  confirmMessage: string | null;
  /** Hours a new order has waited unconfirmed, once past UNCONFIRMED_AFTER_HOURS. */
  unconfirmedHours: number | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
}
