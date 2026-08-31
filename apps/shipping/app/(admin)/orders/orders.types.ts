import type { ShippingStatus } from "@/lib/shipping-status";

export interface ShippingOrderRow {
  orderId: string;
  orderNumber: string;
  totalAmount: string;
  shippingCost: string | null;
  discountAmount: string | null;
  couponCode: string | null;
  paymentStatus: string | null;
  paymentMethod: string;
  orderStatus: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  addressPhone: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  shipmentId: string | null;
  shippingStatus: ShippingStatus;
  providerId: string | null;
  providerName: string | null;
  riderId: string | null;
  riderName: string | null;
}

export interface ShippingStats {
  total: number;
  pending: number;
  assigned: number;
  outForDelivery: number;
  delivered: number;
  failed: number;
  returned: number;
}

export interface StageCounts {
  pending: number;
  confirmed: number;
  shipped: number;
  outForDelivery: number;
  delivered: number;
}

export interface ProviderOption {
  id: string;
  name: string;
  code: string;
}

export interface RiderOption {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isSuspended: boolean | null;
  isAvailable: boolean | null;
  activeDeliveries: number;
  todayDeliveries: number;
  codHeld: number;
}

export interface OrdersPageProps {
  searchParams?: Promise<Record<string, string | undefined>>;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  subtotal: string;
  shippingCost: string | null;
  discountAmount: string | null;
  couponCode: string | null;
  totalAmount: string;
  paymentMethod: string;
  paymentStatus: string | null;
  createdAt: string | null;
  user: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  userAddress_shippingAddressId: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    deliveryInstructions: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  orderItems: Array<{
    id: string;
    productName: string;
    variantName: string | null;
    sku: string;
    quantity: number;
    price: string;
    total: string;
  }>;
  shipments: Array<{
    id: string;
    status: ShippingStatus;
    providerId: string | null;
    riderId: string | null;
    trackingNumber: string | null;
    failureReason: string | null;
    assignedAt: string | null;
    shippedAt: string | null;
    deliveredAt: string | null;
    provider: { id: string; name: string; code: string } | null;
    rider: { id: string; fullName: string | null; phone: string | null } | null;
    deliveries: Array<{
      id: string;
      status: string | null;
      deliveryNotes: string | null;
      proofOfDelivery: unknown;
      createdAt: string | null;
      user: { id: string; fullName: string | null } | null;
    }>;
  }>;
  payments: Array<{
    id: string;
    amount: string;
    method: string;
    status: string | null;
    paymentData: unknown;
    capturedAt: string | null;
    createdAt: string | null;
  }>;
}
