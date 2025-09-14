// apps/ecommerce/types/cart.ts

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: string | number;
  variant?: any;
  savedForLater?: boolean | null;
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
    brand?: {
      name: string;
    } | null;
    seller?: {
      displayName: string;
      slug: string;
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
  };
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
    variant?: any;
  }) => Promise<{ success: boolean; message?: string }>;
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
  refreshCart: () => void;
  // Loading state functions
  isItemLoading: (itemId: string) => boolean;
  isProductLoading: (productId: string) => boolean;
}
