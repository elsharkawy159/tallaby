export interface Order {
  id: string;
  orderNumber: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  totalAmount: number;
  status:
    | "pending"
    | "confirmed"
    | "shipping_soon"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  paymentStatus:
    | "pending"
    | "paid"
    | "failed"
    | "refunded"
    | "partially_refunded";
  orderItems: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
    product?: {
      title?: string;
      sku?: string;
      images?: string[];
    };
    seller?: {
      businessName?: string;
      displayName?: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  byStatus: Array<{
    status: string | null;
    count: number;
    totalRevenue: number;
  }>;
  today: {
    revenue: number | null;
    orders: number | null;
  };
  monthly: {
    revenue: number | null;
    orders: number | null;
  };
}

export interface OrderFilters {
  status?: string;
  paymentStatus?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
