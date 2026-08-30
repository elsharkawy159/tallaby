import type { getProductById } from "@/actions/products";

export type ProductStatus = "draft" | "pending" | "active" | "rejected";

export type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";

export type ProductRaw = NonNullable<
  Awaited<ReturnType<typeof getProductById>>["data"]
>;

export interface ProductTranslationRow {
  locale: string;
  title: string;
  slug: string | null;
  description: string | null;
  bulletPoints: unknown;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface ParsedProductPrice {
  base: number;
  list: number | null;
  final: number;
}

export interface ProductVariantRow {
  id: string;
  sku: string | null;
  title: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  position: number;
}

export interface ProductReviewRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId: string | null;
  orderItemId: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  images: string[];
  isVerifiedPurchase: boolean;
  isAnonymous: boolean;
  status: ReviewStatus;
  helpfulCount: number;
  unhelpfulCount: number;
  reportCount: number;
  createdAt: string;
}

export interface ProductInventoryRow {
  id: string;
  sku: string;
  variantName: string;
  quantity: number;
  status: "in_stock" | "low_stock" | "out_of_stock";
}

export interface InventorySummary {
  totalVariants: number;
  totalQuantity: number;
  lowStock: number;
  outOfStock: number;
}

export interface SalesSummary {
  totalSales: number;
  revenue: number;
  lastMonthSales: number;
  lastMonthRevenue: number;
}

export interface ProductRatingSummary {
  /** Average of approved reviews (matches storefront). */
  averageRating: number;
  /** Count of approved reviews (matches storefront). */
  reviewCount: number;
  /** All reviews regardless of status (admin moderation view). */
  totalReviewCount: number;
}

export interface ProductDetailView {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  bulletPoints: string[];
  sku: string | null;
  basePrice: number;
  listPrice: number | null;
  finalPrice: number;
  averageRating: number;
  reviewCount: number;
  totalReviewCount: number;
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
  seller: {
    id: string;
    businessName: string | null;
    displayName: string | null;
  } | null;
  mainCategory: {
    id: string;
    name: string;
    slug: string;
  };
  status: ProductStatus;
  isPlatformChoice: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  images: string[];
  variants: ProductVariantRow[];
  reviews: ProductReviewRow[];
  inventoryRows: ProductInventoryRow[];
  inventorySummary: InventorySummary;
  salesSummary: SalesSummary;
  createdAt: string;
  updatedAt: string;
  storefrontUrl: string | null;
}
