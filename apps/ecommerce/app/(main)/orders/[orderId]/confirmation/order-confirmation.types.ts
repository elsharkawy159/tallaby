

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
    seller: {
      displayName: string;
      slug: string;
    };
  }>;
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
