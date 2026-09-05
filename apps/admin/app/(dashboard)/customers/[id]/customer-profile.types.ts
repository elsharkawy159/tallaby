export interface CustomerProfilePageProps {
  params: { id: string };
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  totalAmount: string | number;
  status: string | null;
  paymentStatus?: string | null;
  createdAt: string | null;
  updatedAt?: string | null;
}
