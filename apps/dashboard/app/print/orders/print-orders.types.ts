/** The sender on a printout: the store the order was placed on, or Tallaby for marketplace orders. */
export interface PrintSender {
  name: string;
  /** Absolute URL, or null to show the name only. */
  logoUrl: string | null;
  /** The store website, shown under the name. */
  website: string | null;
  phone: string | null;
  /** A marketplace order (sent in Tallaby's name). */
  marketplace: boolean;
}

export interface PrintOrderLine {
  id: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  price: string;
  total: string;
}

/** One order as printed: only the session seller's lines. */
export interface PrintOrder {
  id: string;
  orderNumber: string;
  createdAt: string | null;
  sender: PrintSender;
  customerName: string;
  customerPhone: string | null;
  address: {
    fullName: string | null;
    phone: string | null;
    line: string;
    area: string;
    instructions: string | null;
  } | null;
  notes: string | null;
  giftMessage: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
  lines: PrintOrderLine[];
  itemCount: number;
  /** Every line of the order is this seller's, so the order totals apply to the printout. */
  wholeOrder: boolean;
  /** Sum of this seller's lines. */
  linesTotal: string;
  subtotal: string;
  shippingCost: string;
  discountAmount: string;
  totalAmount: string;
  /** What the courier collects; null when paid or not cash on delivery (amountToCollect). */
  collect: string | null;
}
