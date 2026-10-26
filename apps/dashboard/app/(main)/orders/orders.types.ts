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
  flow: SellerOrderFlow;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
}
