export interface CustomerProfilePageProps {
  params: { id: string };
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}
