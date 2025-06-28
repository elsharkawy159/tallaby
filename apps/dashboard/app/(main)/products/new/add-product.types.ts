export interface AddProductFormData {
  // Basic Product Information
  title: string;
  slug: string;
  description?: string;
  bulletPoints?: string[];

  // Category & Brand
  mainCategoryId: string;
  brandId?: string;

  // Pricing
  basePrice: number;
  listPrice?: number;

  // Product Flags
  isActive: boolean;
  isAdult: boolean;
  isPlatformChoice: boolean;
  isBestSeller: boolean;
  taxClass: "standard" | "reduced" | "zero" | "exempt";

  // SEO & Metadata
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  searchKeywords?: string;

  // Images & Media
  images: string[];

  // Tags
  tags?: string[];

  // Variant Information
  variants: ProductVariantFormData[];

  // Listing Information (per variant)
  listings: ProductListingFormData[];
}

export interface ProductVariantFormData {
  sku: string;
  name: string;
  attributes?: Record<string, any>;
  price: number;
  listPrice?: number;
  isDefault: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  isActive: boolean;
  stockQuantity: number;
}

export interface ProductListingFormData {
  variantId?: string;
  price: number;
  listPrice?: number;
  stockQuantity: number;
  sku: string;
  condition:
    | "new"
    | "renewed"
    | "refurbished"
    | "used_like_new"
    | "used_very_good"
    | "used_good"
    | "used_acceptable";
  fulfillmentType:
    | "seller_fulfilled"
    | "platform_fulfilled"
    | "fba"
    | "digital";
  shippingWeight?: number;
  handlingTime?: number;
  isActive: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId?: string;
}

export interface BrandOption {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isVerified: boolean;
}

export interface ImageUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export interface FormState {
  isLoading: boolean;
  errors: Record<string, string>;
  isDirty: boolean;
  step: number;
}

export interface AddProductProps {
  categories: CategoryOption[];
  brands: BrandOption[];
  initialData?: Partial<AddProductFormData>;
}
