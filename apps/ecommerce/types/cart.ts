// apps/ecommerce/types/cart.ts

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
  }) => Promise<{
    success: boolean;
    message?: string;
    data?: CartItem | null;
    metaEventId?: string;
  }>;
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
