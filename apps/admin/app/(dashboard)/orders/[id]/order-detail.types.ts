export interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export interface OrderDetailWithRelations {
  id: string;
  orderNumber: string;
  userId: string;
  cartId: string | null;
  subtotal: string;
  shippingCost: string;
  tax: string;
  discountAmount: string;
  giftWrapCost: string;
  totalAmount: string;
  currency: string | null;
  status:
    | "pending"
    | "payment_processing"
    | "confirmed"
    | "shipping_soon"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled"
    | "refund_requested"
    | "refunded"
    | "returned";
  paymentStatus:
    | "pending"
    | "authorized"
    | "paid"
    | "failed"
    | "refunded"
    | "partially_refunded";
  paymentMethod: string;
  shippingAddressId: string | null;
  billingAddressId: string | null;
  isGift: boolean;
  giftMessage: string | null;
  couponCode: string | null;
  notes: string | null;
  isBusinessOrder: boolean;
  customerIp: string | null;
  customerUserAgent: string | null;
  referralSource: string | null;
  metadata: any;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  paidAt: string | null;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
  } | null;
  userAddress_shippingAddressId: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
    phone: string | null;
    isDefault: boolean;
  } | null;
  userAddress_billingAddressId: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    state: string | null;
    postalCode: string;
    country: string;
    phone: string | null;
    isDefault: boolean;
  } | null;
  orderItems: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    sellerId: string;
    sku: string;
    productName: string;
    variantName: string | null;
    quantity: number;
    price: string;
    subtotal: string;
    tax: string;
    shippingCost: string;
    discountAmount: string;
    total: string;
    commissionAmount: string;
    commissionRate: number;
    sellerEarning: string;
    currency: string | null;
    condition: string;
    fulfillmentType: string;
    status: string;
    product: {
      id: string;
      title: string;
      images: string[] | null;
      sku: string | null;
    } | null;
    productVariant: {
      id: string;
      title: string | null;
      imageUrl: string | null;
      sku: string | null;
    } | null;
    seller: {
      id: string;
      businessName: string;
      displayName: string;
    } | null;
  }>;
  payments: Array<{
    id: string;
    orderId: string;
    amount: string;
    method: string;
    currency: string | null;
    status: string;
    transactionId: string | null;
    paymentMethodId: string | null;
    paymentData: any;
    errorMessage: string | null;
    authorizedAt: string | null;
    capturedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  shipments: Array<{
    id: string;
    orderId: string;
    sellerId: string;
    trackingNumber: string | null;
    carrier: string | null;
    status: string;
    shippedAt: string | null;
    estimatedDeliveryAt: string | null;
    deliveredAt: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}