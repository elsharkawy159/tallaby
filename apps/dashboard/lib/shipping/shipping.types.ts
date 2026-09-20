import type { ShippingStatus } from "./shipping-status";

export interface ShippingOrderRow {
  /** orders.id (also the row id for the table). */
  id: string;
  orderNumber: string;
  createdAt: string;
  orderStatus: string;
  shipmentId: string | null;
  /** Shipment status; "pending" while no shipment row exists yet. */
  status: ShippingStatus;
  /** False when Tallaby (or another party) already owns the shipment. */
  editable: boolean;
  failureReason: string | null;
  riderId: string | null;
  riderName: string | null;
  customerName: string;
  customerPhone: string | null;
  addressLine: string;
  city: string | null;
  deliveryInstructions: string | null;
  itemCount: number;
  itemsSummary: string;
  /** This seller's share of the order (sum of their item totals). */
  total: number;
  paymentMethod: string | null;
  paymentStatus: string | null;
  /** Amount the rider has to collect in cash; 0 when prepaid/collected. */
  codDue: number;
  assignedAt: string | null;
  deliveredAt: string | null;
}

export interface SellerRider {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
  isAvailable: boolean;
  activeDeliveries: number;
  deliveredTotal: number;
  createdAt: string | null;
}

export interface ShippingOverview {
  orders: ShippingOrderRow[];
  riders: SellerRider[];
}
