
export interface OrderItemReview {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[] | null;
  status: string | null;
  isAnonymous: boolean | null;
}

export interface StoreSellerReview {
  sellerId: string;
  displayName: string;
  slug: string;
  hasStoreReview: boolean;
  storeReview: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    status: string | null;
    isAnonymous: boolean | null;
  } | null;
}

export interface ShipmentInfo {
  trackingNumber: string | null;
  carrier: string | null;
  status: string | null;
  estimatedDeliveryDate: string | null;
}

export interface OrderConfirmationData {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    createdAt: string;
    totalAmount: string;
    currency: string;
    paymentStatus: string;
    paymentMethod: string;
    isGift: boolean;
    giftMessage?: string;
    notes?: string;
  };
  orderItems: Array<{
    id: string;
    productId: string;
    sellerId: string;
    productName: string;
    variantName?: string;
    quantity: number;
    price: string;
    subtotal: string;
    product: {
      title: string;
      slug: string;
      images: string[];
    };
    variant: {
      imageUrl: string | null;
    } | null;
    seller: {
      displayName: string;
      slug: string;
    };
    hasReview: boolean;
    review: OrderItemReview | null;
  }>;
  storeSellers: StoreSellerReview[];
  shipments: ShipmentInfo[];
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  billingAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  summary: {
    subtotal: number;
    tax: number;
    shippingCost: number;
    discountAmount: number;
    totalAmount: number;
    itemCount: number;
  };
}
