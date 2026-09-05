export interface PendingCartUser {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
  receiveMarketingEmails: boolean;
  preferredLanguage: string | null;
}

export interface PendingCartItem {
  id: string;
  productId: string;
  sellerId: string;
  quantity: number;
  price: number;
  lineTotal: number;
  savedForLater: boolean;
  variant: unknown;
  createdAt: string | null;
  updatedAt: string | null;
  productTitle: string;
  productSku: string | null;
  productImage: string | null;
  productSlug: string | null;
  sellerName: string;
}

export interface PendingCart {
  id: string;
  userId: string;
  sessionId: string | null;
  status: string;
  currency: string;
  createdAt: string | null;
  updatedAt: string | null;
  lastActivity: string | null;
  itemCount: number;
  totalValue: number;
  isAbandoned: boolean;
  user: PendingCartUser | null;
  items: PendingCartItem[];
}

export interface PendingCartStats {
  activeCarts: number;
  withItems: number;
  cartValue: number;
  abandoned: number;
  abandonedDays: number;
}

export type PendingCartsTab = "all" | "with-items" | "abandoned";
