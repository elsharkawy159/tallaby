export interface CustomerProfilePageProps {
  params: Promise<{ id: string }>;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  totalAmount: string | number;
  status: string | null;
  paymentStatus?: string | null;
  createdAt: string | null;
  updatedAt?: string | null;
  /** The store it was placed in; marketplace orders have none. */
  store?: { id: string; name: string; logoUrl: string | null } | null;
}
