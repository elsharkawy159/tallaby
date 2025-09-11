import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import {
  getCartItems,
  addToCart as addToCartAction,
  updateCartItem,
  removeFromCart as removeFromCartAction,
  clearCart as clearCartAction,
  mergeAnonymousCart,
} from "@/actions/cart";
import { getUser } from "@/actions/auth";

// Types
export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price: string | number;
  variant?: any;
  savedForLater: boolean | null;
  sellerId: string;
  product: {
    id: string;
    title: string;
    slug: string;
    images: any;
    sellerId: string;
    brand?: {
      name: string;
    };
    seller?: {
      displayName: string;
      slug: string;
    };
  };
}

export interface CartSummary {
  cart: {
    id: string;
    userId?: string;
    sessionId?: string;
    status: string;
    currency: string;
    lastActivity?: string;
    createdAt: string;
    updatedAt: string;
  };
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

interface GuestCartItem {
  productId: string;
  quantity: number;
  price: string | number;
  variant?: any;
  sellerId: string;
  product: {
    id: string;
    title: string;
    slug: string;
    images: any;
    sellerId: string;
    brand?: {
      name: string;
    };
    seller?: {
      displayName: string;
      slug: string;
    };
  };
}

interface GuestCart {
  items: GuestCartItem[];
  subtotal: number;
  itemCount: number;
  sessionId: string;
}

interface CartState {
  // State
  cartData: CartSummary | null;
  loading: boolean;
  isAdding: boolean;
  isUpdating: boolean;
  isRemoving: boolean;
  isClearing: boolean;
  isAuthenticated: boolean;

  // Actions
  setCartData: (data: CartSummary | null) => void;
  setLoading: (loading: boolean) => void;
  setIsAdding: (isAdding: boolean) => void;
  setIsUpdating: (isUpdating: boolean) => void;
  setIsRemoving: (isRemoving: boolean) => void;
  setIsClearing: (isClearing: boolean) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;

  // Cart operations
  fetchCartItems: () => Promise<void>;
  addToCart: (data: {
    productId: string;
    quantity?: number;
    variantId?: string;
    variant?: any;
  }) => Promise<{ success: boolean; error?: string }>;
  updateQuantity: (
    itemId: string,
    quantity: number
  ) => Promise<{ success: boolean; error?: string }>;
  removeFromCart: (
    itemId: string
  ) => Promise<{ success: boolean; error?: string }>;
  clearCart: () => Promise<{ success: boolean; error?: string }>;

  // Utilities
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
  refetch: () => Promise<void>;

  // Computed values
  itemCount: number;
  subtotal: number;
  cartItems: CartItem[];

  // Guest cart operations
  saveGuestCart: (cart: GuestCart) => void;
  loadGuestCart: () => GuestCart | null;
  clearGuestCart: () => void;
  guestCartToServerFormat: (guestCart: GuestCart) => CartSummary;
  handleUserLogin: () => Promise<void>;
}

// Constants
const CART_STORAGE_KEY = "guest_cart";
const SESSION_ID_KEY = "session_id";

// Helper functions
const getSessionId = () => {
  if (typeof window === "undefined") return null;

  let sessionId = localStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // Initial state
      cartData: null,
      loading: true,
      isAdding: false,
      isUpdating: false,
      isRemoving: false,
      isClearing: false,
      isAuthenticated: false,

      // Setters
      setCartData: (data) => set({ cartData: data }),
      setLoading: (loading) => set({ loading }),
      setIsAdding: (isAdding) => set({ isAdding }),
      setIsUpdating: (isUpdating) => set({ isUpdating }),
      setIsRemoving: (isRemoving) => set({ isRemoving }),
      setIsClearing: (isClearing) => set({ isClearing }),
      setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      // Guest cart utilities
      saveGuestCart: (cart) => {
        if (typeof window === "undefined") return;
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      },

      loadGuestCart: (): GuestCart | null => {
        if (typeof window === "undefined") return null;

        try {
          const stored = localStorage.getItem(CART_STORAGE_KEY);
          if (!stored) return null;

          const cart = JSON.parse(stored) as GuestCart;
          // Validate session ID matches
          if (cart.sessionId !== getSessionId()) {
            localStorage.removeItem(CART_STORAGE_KEY);
            return null;
          }
          return cart;
        } catch {
          localStorage.removeItem(CART_STORAGE_KEY);
          return null;
        }
      },

      clearGuestCart: () => {
        if (typeof window === "undefined") return;
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(SESSION_ID_KEY);
      },

      guestCartToServerFormat: (guestCart: GuestCart): CartSummary => {
        const items: CartItem[] = guestCart.items.map((item, index) => ({
          id: `guest-${index}`,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant,
          savedForLater: false,
          sellerId: item.sellerId,
          product: item.product,
        }));

        return {
          cart: {
            id: "guest-cart",
            sessionId: guestCart.sessionId,
            status: "active",
            currency: "EGP",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          items,
          subtotal: guestCart.subtotal,
          itemCount: guestCart.itemCount,
        };
      },

      // Fetch cart items
      fetchCartItems: async () => {
        try {
          set({ loading: true });

          const user = await getUser();
          const isAuthenticated = !!user;
          set({ isAuthenticated });

          if (user) {
            // Authenticated user - fetch from server
            const result = await getCartItems();

            if (result.success && result.data) {
              set({ cartData: result.data as CartSummary });
            } else {
              set({ cartData: null });
            }
          } else {
            // Guest user - load from localStorage
            const guestCart = get().loadGuestCart();
            if (guestCart) {
              const serverFormat = get().guestCartToServerFormat(guestCart);
              set({ cartData: serverFormat });
            } else {
              set({ cartData: null });
            }
          }
        } catch (error) {
          console.error("Error fetching cart items:", error);
          set({ cartData: null });
        } finally {
          set({ loading: false });
        }
      },

      // Add to cart with optimistic updates
      addToCart: async (data) => {
        try {
          set({ isAdding: true });

          const currentCart = get().cartData;
          const isAuthenticated = get().isAuthenticated;

          // Optimistic update
          let optimisticCart: CartSummary;

          if (!currentCart) {
            // Create new cart
            const sessionId = getSessionId()!;
            const newItem: CartItem = {
              id: `temp-${Date.now()}`,
              productId: data.productId,
              quantity: data.quantity || 1,
              price: 0,
              variant: data.variant,
              savedForLater: false,
              sellerId: "",
              product: {
                id: data.productId,
                title: "Loading...",
                slug: "",
                images: null,
                sellerId: "",
              },
            };

            optimisticCart = {
              cart: {
                id: "temp-cart",
                sessionId,
                status: "active",
                currency: "EGP",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              items: [newItem],
              subtotal: 0,
              itemCount: data.quantity || 1,
            };
          } else {
            // Check if item already exists
            const existingItemIndex = currentCart.items.findIndex(
              (item) => item.productId === data.productId && !item.savedForLater
            );

            if (existingItemIndex >= 0) {
              // Update existing item
              const updatedItems = [...currentCart.items];
              const existingItem = updatedItems[existingItemIndex];
              if (existingItem) {
                updatedItems[existingItemIndex] = {
                  ...existingItem,
                  quantity: existingItem.quantity + (data.quantity || 1),
                };
              }

              const subtotal = updatedItems
                .filter((item) => !item.savedForLater)
                .reduce(
                  (sum, item) => sum + Number(item.price) * item.quantity,
                  0
                );

              const itemCount = updatedItems
                .filter((item) => !item.savedForLater)
                .reduce((sum, item) => sum + item.quantity, 0);

              optimisticCart = {
                ...currentCart,
                items: updatedItems,
                subtotal,
                itemCount,
              };
            } else {
              // Add new item
              const newItem: CartItem = {
                id: `temp-${Date.now()}`,
                productId: data.productId,
                quantity: data.quantity || 1,
                price: 0,
                variant: data.variant,
                savedForLater: false,
                sellerId: "",
                product: {
                  id: data.productId,
                  title: "Loading...",
                  slug: "",
                  images: null,
                  sellerId: "",
                },
              };

              const updatedItems = [...currentCart.items, newItem];
              const subtotal = updatedItems
                .filter((item) => !item.savedForLater)
                .reduce(
                  (sum, item) => sum + Number(item.price) * item.quantity,
                  0
                );

              const itemCount = updatedItems
                .filter((item) => !item.savedForLater)
                .reduce((sum, item) => sum + item.quantity, 0);

              optimisticCart = {
                ...currentCart,
                items: updatedItems,
                subtotal,
                itemCount,
              };
            }
          }

          // Apply optimistic update
          set({ cartData: optimisticCart });

          // Update localStorage for guest users
          if (!isAuthenticated) {
            const guestCart: GuestCart = {
              items: optimisticCart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                variant: item.variant,
                sellerId: item.sellerId,
                product: item.product,
              })),
              subtotal: optimisticCart.subtotal,
              itemCount: optimisticCart.itemCount,
              sessionId: getSessionId()!,
            };
            get().saveGuestCart(guestCart);
          }

          // Fire backend mutation
          const result = await addToCartAction(data);

          if (result.success) {
            // Refresh cart data from server
            await get().fetchCartItems();
            toast.success("Added to cart");
            return { success: true };
          } else {
            // Rollback on failure
            await get().fetchCartItems();
            toast.error(result.error || "Failed to add to cart");
            return { success: false, error: result.error };
          }
        } catch (error) {
          console.error("Error adding to cart:", error);
          await get().fetchCartItems();
          toast.error("Failed to add to cart");
          return { success: false, error: "Failed to add to cart" };
        } finally {
          set({ isAdding: false });
        }
      },

      // Update quantity with optimistic updates
      updateQuantity: async (itemId, quantity) => {
        try {
          set({ isUpdating: true });

          const currentCart = get().cartData;
          const isAuthenticated = get().isAuthenticated;

          if (!currentCart) return { success: false, error: "No cart found" };

          // Optimistic update
          let optimisticCart: CartSummary | null = null;

          if (quantity <= 0) {
            // Remove item
            const updatedItems = currentCart.items.filter(
              (item) => item.id !== itemId
            );

            if (updatedItems.length === 0) {
              optimisticCart = null;
            } else {
              const subtotal = updatedItems
                .filter((item) => !item.savedForLater)
                .reduce(
                  (sum, item) => sum + Number(item.price) * item.quantity,
                  0
                );

              const itemCount = updatedItems
                .filter((item) => !item.savedForLater)
                .reduce((sum, item) => sum + item.quantity, 0);

              optimisticCart = {
                ...currentCart,
                items: updatedItems,
                subtotal,
                itemCount,
              };
            }
          } else {
            // Update quantity
            const updatedItems = currentCart.items.map((item) =>
              item.id === itemId ? { ...item, quantity } : item
            );

            const subtotal = updatedItems
              .filter((item) => !item.savedForLater)
              .reduce(
                (sum, item) => sum + Number(item.price) * item.quantity,
                0
              );

            const itemCount = updatedItems
              .filter((item) => !item.savedForLater)
              .reduce((sum, item) => sum + item.quantity, 0);

            optimisticCart = {
              ...currentCart,
              items: updatedItems,
              subtotal,
              itemCount,
            };
          }

          // Apply optimistic update
          set({ cartData: optimisticCart });

          // Update localStorage for guest users
          if (!isAuthenticated && optimisticCart) {
            const guestCart: GuestCart = {
              items: optimisticCart.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                variant: item.variant,
                sellerId: item.sellerId,
                product: item.product,
              })),
              subtotal: optimisticCart.subtotal,
              itemCount: optimisticCart.itemCount,
              sessionId: getSessionId()!,
            };
            get().saveGuestCart(guestCart);
          } else if (!isAuthenticated && !optimisticCart) {
            get().clearGuestCart();
          }

          // Fire backend mutation
          const result = await updateCartItem(itemId, quantity);

          if (result.success) {
            // Refresh cart data from server
            await get().fetchCartItems();
            return { success: true };
          } else {
            // Rollback on failure
            await get().fetchCartItems();
            toast.error(result.error || "Failed to update quantity");
            return { success: false, error: result.error };
          }
        } catch (error) {
          console.error("Error updating quantity:", error);
          await get().fetchCartItems();
          toast.error("Failed to update quantity");
          return { success: false, error: "Failed to update quantity" };
        } finally {
          set({ isUpdating: false });
        }
      },

      // Remove from cart with optimistic updates
      removeFromCart: async (itemId) => {
        try {
          set({ isRemoving: true });

          const currentCart = get().cartData;
          const isAuthenticated = get().isAuthenticated;

          if (!currentCart) return { success: false, error: "No cart found" };

          // Optimistic update
          const updatedItems = currentCart.items.filter(
            (item) => item.id !== itemId
          );

          let optimisticCart: CartSummary | null = null;
          if (updatedItems.length > 0) {
            const subtotal = updatedItems
              .filter((item) => !item.savedForLater)
              .reduce(
                (sum, item) => sum + Number(item.price) * item.quantity,
                0
              );

            const itemCount = updatedItems
              .filter((item) => !item.savedForLater)
              .reduce((sum, item) => sum + item.quantity, 0);

            optimisticCart = {
              ...currentCart,
              items: updatedItems,
              subtotal,
              itemCount,
            };
          }

          // Apply optimistic update
          set({ cartData: optimisticCart });

          // Update localStorage for guest users
          if (!isAuthenticated) {
            if (optimisticCart) {
              const guestCart: GuestCart = {
                items: optimisticCart.items.map((item) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.price,
                  variant: item.variant,
                  sellerId: item.sellerId,
                  product: item.product,
                })),
                subtotal: optimisticCart.subtotal,
                itemCount: optimisticCart.itemCount,
                sessionId: getSessionId()!,
              };
              get().saveGuestCart(guestCart);
            } else {
              get().clearGuestCart();
            }
          }

          // Fire backend mutation
          const result = await removeFromCartAction(itemId);

          if (result.success) {
            // Refresh cart data from server
            await get().fetchCartItems();
            toast.success(result.message || "Removed from cart");
            return { success: true };
          } else {
            // Rollback on failure
            await get().fetchCartItems();
            toast.error(result.error || "Failed to remove from cart");
            return { success: false, error: result.error };
          }
        } catch (error) {
          console.error("Error removing from cart:", error);
          await get().fetchCartItems();
          toast.error("Failed to remove from cart");
          return { success: false, error: "Failed to remove from cart" };
        } finally {
          set({ isRemoving: false });
        }
      },

      // Clear cart with optimistic updates
      clearCart: async () => {
        try {
          set({ isClearing: true });

          const isAuthenticated = get().isAuthenticated;

          // Apply optimistic update
          set({ cartData: null });

          // Clear localStorage for guest users
          if (!isAuthenticated) {
            get().clearGuestCart();
          }

          // Fire backend mutation
          const result = await clearCartAction();

          if (result.success) {
            // Refresh cart data from server
            await get().fetchCartItems();
            toast.success(result.message || "Cart cleared");
            return { success: true };
          } else {
            // Rollback on failure
            await get().fetchCartItems();
            toast.error(result.error || "Failed to clear cart");
            return { success: false, error: result.error };
          }
        } catch (error) {
          console.error("Error clearing cart:", error);
          await get().fetchCartItems();
          toast.error("Failed to clear cart");
          return { success: false, error: "Failed to clear cart" };
        } finally {
          set({ isClearing: false });
        }
      },

      // Utility functions
      isInCart: (productId) => {
        const cartData = get().cartData;
        if (!cartData?.items) return false;
        return cartData.items.some(
          (item) => item.productId === productId && !item.savedForLater
        );
      },

      getItemQuantity: (productId) => {
        const cartData = get().cartData;
        if (!cartData?.items) return 0;
        const item = cartData.items.find(
          (item) => item.productId === productId && !item.savedForLater
        );
        return item?.quantity || 0;
      },

      // Computed values
      get itemCount() {
        return get().cartData?.itemCount || 0;
      },

      get subtotal() {
        return get().cartData?.subtotal || 0;
      },

      get cartItems() {
        return get().cartData?.items || [];
      },

      refetch: async () => {
        await get().fetchCartItems();
      },

      // Handle guest to authenticated user transition
      handleUserLogin: async () => {
        try {
          const user = await getUser();
          if (user) {
            set({ isAuthenticated: true });

            // Merge anonymous cart if exists
            const sessionId = localStorage.getItem(SESSION_ID_KEY);
            if (sessionId) {
              await mergeAnonymousCart(sessionId);
              localStorage.removeItem(SESSION_ID_KEY);
            }

            // Clear guest cart from localStorage
            get().clearGuestCart();

            // Fetch fresh cart data from server
            await get().fetchCartItems();
          }
        } catch (error) {
          console.error("Error handling user login:", error);
        }
      },
    }),
    {
      name: "cart-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist essential state, not loading states
        cartData: state.cartData,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
