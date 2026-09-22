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
  /** Variant display name from the cart snapshot, e.g. "Lemon (Cute Print)". */
  variantTitle: string | null;
  /** Non-empty option1-3 values, e.g. ["Design: Lemon (Cute Print)"]. */
  variantOptions: string[];
  variantSku: string | null;
  variantImage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  productTitle: string;
  productSku: string | null;
  /** Variant image when present, otherwise the product's first image. */
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
  /** Set once an admin sends the WhatsApp reminder. */
  reminderSentAt: string | null;
  itemCount: number;
  totalValue: number;
  isAbandoned: boolean;
  user: PendingCartUser | null;
  /** Default address phone, used when the account has no phone (detail only). */
  fallbackPhone: string | null;
  items: PendingCartItem[];
}

export interface PendingCartStats {
  activeCarts: number;
  withItems: number;
  cartValue: number;
  abandoned: number;
  reminded: number;
  abandonedDays: number;
}

export type { PendingCartsView as PendingCartsTab } from "@/actions/pending-carts";
