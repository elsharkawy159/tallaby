// apps/ecommerce/types/cart.ts
import type { CustomerInputError, CustomerInputValue } from "@workspace/lib/products/customer-fields";

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: string | number;
  variant?: any;
  savedForLater?: boolean | null;
  /** A free gift (0149): one unit at price 0. */
  giftRuleId?: string | null;
  /** A cross-sell line (0145). */
  crossSellId?: string | null;
  /** What the customer filled for the product's requirements (0167, F-91); `price` includes the extras. */
  customerInputs?: unknown;
  sellerId: string;
  cartId: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  product: {
    id: string;
    title: string;
    slug: string;
    images: any;
    sellerId: string;
    productType?: string | null;
    freeDelivery?: boolean | null;
    /** The seller's minimum per order (0151). */
    minOrderQuantity?: number | null;
    brand?: {
      name: string;
    } | null;
    seller?: {
      displayName: string;
      slug: string;
      freeDelivery?: boolean | null;
    } | null;
  };
}

export interface CartSummary {
  cart: {
    id: string;
    userId?: string;
    sessionId?: string | null;
    status: string | null;
    currency: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    lastActivity?: string | null;
  } | null;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
  /** Short-lived links to the customer's own photos on the lines (F-91). */
  customerUploadViews?: Record<string, string>;
}

export interface CartState {
  cartData: CartSummary | null;
  cartItems: CartItem[];
  itemCount: number;
  subtotal: number;
  loading: boolean;
  addToCart: (params: {
    productId: string;
    quantity: number;
    variantId?: string;
    customerInputs?: CustomerInputValue[];
  }) => Promise<{
    success: boolean;
    message?: string;
    data?: CartItem | null;
    metaEventId?: string;
    /** The server refused the customer requirements (F-91). */
    customerInputErrors?: CustomerInputError[];
  }>;
  /** Several variants of one product at once (one toast, one refresh). */
  addLinesToCart: (params: {
    productId: string;
    lines: { variantId?: string; quantity: number }[];
    customerInputs?: CustomerInputValue[];
  }) => Promise<{ success: boolean; added: number; value: number; metaEventId?: string; customerInputErrors?: CustomerInputError[] }>;
  updateQuantity: (
    itemId: string,
    quantity: number
  ) => Promise<{ success: boolean; message?: string }>;
  removeFromCart: (
    itemId: string
  ) => Promise<{ success: boolean; message?: string }>;
  clearCart: () => Promise<{ success: boolean; message?: string }>;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  getCartItem: (productId: string) => CartItem | undefined;
  getCartItemById: (cartItemId: string) => CartItem | undefined;
  refreshCart: () => void;
  // Loading state functions
  isItemLoading: (itemId: string) => boolean;
  isProductLoading: (productId: string) => boolean;
}
