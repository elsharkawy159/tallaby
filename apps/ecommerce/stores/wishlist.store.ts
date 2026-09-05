import { create } from "zustand";

interface WishlistItem {
  id: string;
  productId: string;
}

interface WishlistStore {
  wishlistItems: WishlistItem[];
  setWishlistItems: (items: WishlistItem[]) => void;
  addItem: (item: WishlistItem) => void;
  removeItem: (productId: string) => void;
}

export const useWishlistStore = create<WishlistStore>((set) => ({
  wishlistItems: [],
  setWishlistItems: (items) => set({ wishlistItems: items }),
  addItem: (item) =>
    set((state) => ({ wishlistItems: [...state.wishlistItems, item] })),
  removeItem: (productId) =>
    set((state) => ({
      wishlistItems: state.wishlistItems.filter(
        (item) => item.productId !== productId
      ),
    })),
}));
