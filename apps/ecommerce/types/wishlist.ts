// apps/ecommerce/types/wishlist.ts

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  variantId?: string | null;
  notes?: string | null;
  quantity?: number | null;
  priority?: number | null;
  addedAt?: string | null;
  product: {
    id: string;
    title: string;
    slug: string;
    images: any;
    price: string | number | unknown;
    brand?: {
      name: string;
    } | null;
    seller?: {
      displayName: string;
      slug: string;
    } | null;
    productVariants?: Array<{
      id: string;
      title?: string | null;
      price?: string | number | null;
      sku?: string | null;
      stock?: number | null;
      imageUrl?: string | null;
      createdAt?: string;
      updatedAt?: string;
      productId?: string | null;
      weight?: number | null;
      dimensions?: string | null;
      color?: string | null;
      size?: string | null;
      material?: string | null;
      barCode?: string | null;
    }>;
    averageRating?: number | null;
    reviewCount?: number;
  };
  productVariant?: {
    id: string;
    title?: string | null;
    price?: string | number | null;
    sku?: string | null;
    stock?: number | null;
    imageUrl?: string | null;
    createdAt?: string;
    updatedAt?: string;
    productId?: string | null;
    weight?: number | null;
    dimensions?: string | null;
    color?: string | null;
    size?: string | null;
    material?: string | null;
    barCode?: string | null;
  } | null;
}

export interface Wishlist {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  isPublic?: boolean | null;
  isDefault?: boolean | null;
  shareUrl?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  items?: WishlistItem[];
}

export interface WishlistState {
  wishlists: Wishlist[];
  defaultWishlist: Wishlist | null;
  wishlistItems: WishlistItem[];
  itemCount: number;
  loading: boolean;
  addToWishlist: (params: {
    productId: string;
    variantId?: string;
    wishlistId?: string;
    notes?: string;
    quantity?: number;
    priority?: number;
  }) => Promise<{ success: boolean; message?: string }>;
  removeFromWishlist: (
    itemId: string
  ) => Promise<{ success: boolean; message?: string }>;
  moveToCart: (
    itemId: string
  ) => Promise<{ success: boolean; message?: string }>;
  createWishlist: (params: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) => Promise<{ success: boolean; message?: string }>;
  updateWishlist: (
    wishlistId: string,
    params: {
      name?: string;
      description?: string;
      isPublic?: boolean;
    }
  ) => Promise<{ success: boolean; message?: string }>;
  deleteWishlist: (
    wishlistId: string
  ) => Promise<{ success: boolean; message?: string }>;
  isInWishlist: (productId: string, wishlistId?: string) => boolean;
  refreshWishlist: () => void;
  // Loading state functions
  isItemLoading: (itemId: string) => boolean;
  isProductLoading: (productId: string) => boolean;
  isWishlistLoading: (wishlistId: string) => boolean;
}
