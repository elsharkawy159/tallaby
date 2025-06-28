import { z } from "zod";

// Enhanced Product Schemas with better validation
export const productSchema = z
  .object({
    title: z
      .string()
      .min(1, "Product title is required")
      .max(255, "Title must be less than 255 characters")
      .trim()
      .refine(
        (val) => val.length >= 3,
        "Title must be at least 3 characters long"
      ),
    slug: z
      .string()
      .min(1, "Product slug is required")
      .max(255, "Slug must be less than 255 characters")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens"
      )
      .trim()
      .refine(
        (val) => val.length >= 3,
        "Slug must be at least 3 characters long"
      ),
    description: z
      .string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must be less than 2000 characters")
      .optional(),
    bulletPoints: z
      .array(
        z
          .string()
          .min(1, "Feature cannot be empty")
          .max(200, "Feature too long")
      )
      .max(10, "Maximum 10 bullet points allowed")
      .optional(),
    brandId: z.string()
    // .uuid("Invalid brand ID")
    .optional(),
    mainCategoryId: z.string()
    // .uuid("Please select a valid category")
    ,
    listPrice: z
      .number()
      .min(0, "List price must be positive")
      .max(999999.99, "List price too high")
      .optional(),
    basePrice: z
      .number()
      .min(0.01, "Base price must be greater than 0")
      .max(999999.99, "Base price too high"),
    isActive: z.boolean().default(true),
    isAdult: z.boolean().default(false),
    isPlatformChoice: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    taxClass: z
      .enum(["standard", "reduced", "zero", "exempt"])
      .default("standard"),
    metaTitle: z
      .string()
      .max(60, "Meta title must be less than 60 characters")
      .optional(),
    metaDescription: z
      .string()
      .max(160, "Meta description must be less than 160 characters")
      .optional(),
    metaKeywords: z.string().max(500, "Meta keywords too long").optional(),
    searchKeywords: z.string().max(500, "Search keywords too long").optional(),
    images: z
      .array(z.string().url("Invalid image URL"))
      .max(10, "Maximum 10 images allowed")
      .optional(),
    tags: z
      .array(z.string().min(1, "Tag cannot be empty").max(50, "Tag too long"))
      .max(20, "Maximum 20 tags allowed")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.listPrice && data.basePrice) {
        return data.listPrice >= data.basePrice;
      }
      return true;
    },
    {
      message: "List price must be greater than or equal to base price",
      path: ["listPrice"],
    }
  );

// Enhanced Product Variant Schema
export const productVariantSchema = z
  .object({
    sku: z
      .string()
      .min(1, "SKU is required")
      .max(100, "SKU must be less than 100 characters")
      .regex(
        /^[A-Z0-9_-]+$/,
        "SKU can only contain uppercase letters, numbers, hyphens, and underscores"
      )
      .trim(),
    name: z
      .string()
      .min(1, "Variant name is required")
      .max(255, "Variant name must be less than 255 characters")
      .trim(),
    attributes: z.record(z.any()).optional(),
    price: z
      .number()
      .min(0.01, "Price must be greater than 0")
      .max(999999.99, "Price too high"),
    listPrice: z
      .number()
      .min(0, "List price must be positive")
      .max(999999.99, "List price too high")
      .optional(),
    isDefault: z.boolean().default(false),
    weight: z
      .number()
      .min(0, "Weight must be positive")
      .max(999.99, "Weight too high")
      .optional(),
    dimensions: z
      .object({
        length: z.number().min(0).max(999.99).optional(),
        width: z.number().min(0).max(999.99).optional(),
        height: z.number().min(0).max(999.99).optional(),
      })
      .optional(),
    isActive: z.boolean().default(true),
    stockQuantity: z
      .number()
      .min(0, "Stock quantity must be non-negative")
      .max(999999, "Stock quantity too high")
      .default(0),
  })
  .refine(
    (data) => {
      if (data.listPrice && data.price) {
        return data.listPrice >= data.price;
      }
      return true;
    },
    {
      message: "List price must be greater than or equal to price",
      path: ["listPrice"],
    }
  );

// Enhanced Product Listing Schema
export const productListingSchema = z
  .object({
    productId: z.string().uuid("Invalid product ID"),
    variantId: z.string().uuid("Invalid variant ID").optional(),
    price: z
      .number()
      .min(0.01, "Price must be greater than 0")
      .max(999999.99, "Price too high"),
    listPrice: z
      .number()
      .min(0, "List price must be positive")
      .max(999999.99, "List price too high")
      .optional(),
    stockQuantity: z
      .number()
      .min(0, "Stock quantity must be non-negative")
      .max(999999, "Stock quantity too high"),
    sku: z
      .string()
      .min(1, "SKU is required")
      .max(100, "SKU must be less than 100 characters")
      .regex(
        /^[A-Z0-9_-]+$/,
        "SKU can only contain uppercase letters, numbers, hyphens, and underscores"
      )
      .trim(),
    condition: z
      .enum([
        "new",
        "renewed",
        "refurbished",
        "used_like_new",
        "used_very_good",
        "used_good",
        "used_acceptable",
      ])
      .default("new"),
    fulfillmentType: z
      .enum(["seller_fulfilled", "platform_fulfilled", "fba", "digital"])
      .default("seller_fulfilled"),
    shippingWeight: z
      .number()
      .min(0, "Shipping weight must be positive")
      .max(999.99, "Shipping weight too high")
      .optional(),
    shippingDimensions: z
      .object({
        length: z.number().min(0).max(999.99).optional(),
        width: z.number().min(0).max(999.99).optional(),
        height: z.number().min(0).max(999.99).optional(),
      })
      .optional(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    isOnSale: z.boolean().default(false),
    salePrice: z
      .number()
      .min(0, "Sale price must be positive")
      .max(999999.99, "Sale price too high")
      .optional(),
    saleStartDate: z.string().datetime().optional(),
    saleEndDate: z.string().datetime().optional(),
    tags: z
      .array(z.string().min(1, "Tag cannot be empty").max(50, "Tag too long"))
      .max(20, "Maximum 20 tags allowed")
      .optional(),
    seoKeywords: z
      .array(
        z
          .string()
          .min(1, "Keyword cannot be empty")
          .max(100, "Keyword too long")
      )
      .max(50, "Maximum 50 SEO keywords allowed")
      .optional(),
    sellerId: z.string().uuid("Invalid seller ID"),
  })
  .refine(
    (data) => {
      if (data.listPrice && data.price) {
        return data.listPrice >= data.price;
      }
      return true;
    },
    {
      message: "List price must be greater than or equal to price",
      path: ["listPrice"],
    }
  )
  .refine(
    (data) => {
      if (data.salePrice && data.price) {
        return data.salePrice <= data.price;
      }
      return true;
    },
    {
      message: "Sale price must be less than or equal to regular price",
      path: ["salePrice"],
    }
  );

// Enhanced Order Schemas
export const orderUpdateSchema = z.object({
  status: z.enum([
    "pending",
    "payment_processing",
    "confirmed",
    "shipping_soon",
    "shipped",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "refund_requested",
    "refunded",
    "returned",
  ]),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url("Invalid tracking URL").optional(),
  estimatedDelivery: z.string().datetime().optional(),
  notes: z.string().max(500, "Notes too long").optional(),
  isUrgent: z.boolean().default(false),
});

export const orderItemUpdateSchema = z.object({
  itemId: z.string().uuid("Invalid item ID"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  status: z.enum([
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "returned",
  ]),
  notes: z.string().max(200, "Notes too long").optional(),
});

// Enhanced Coupon Schema
export const couponSchema = z
  .object({
    code: z
      .string()
      .min(3, "Coupon code must be at least 3 characters")
      .max(50, "Coupon code too long")
      .regex(
        /^[A-Z0-9_-]+$/,
        "Code can only contain uppercase letters, numbers, hyphens, and underscores"
      )
      .trim(),
    name: z
      .string()
      .min(1, "Coupon name is required")
      .max(255, "Coupon name too long")
      .trim(),
    description: z.string().max(500, "Description too long").optional(),
    discountType: z.enum([
      "percentage",
      "fixed_amount",
      "buy_x_get_y",
      "free_shipping",
    ]),
    discountValue: z
      .number()
      .min(0.01, "Discount value must be greater than 0")
      .max(999999.99, "Discount value too high"),
    minimumPurchase: z
      .number()
      .min(0, "Minimum purchase must be positive")
      .max(999999.99, "Minimum purchase too high")
      .optional(),
    maximumDiscount: z
      .number()
      .min(0, "Maximum discount must be positive")
      .max(999999.99, "Maximum discount too high")
      .optional(),
    isActive: z.boolean().default(true),
    isOneTimeUse: z.boolean().default(false),
    usageLimit: z.number().min(1, "Usage limit must be at least 1").optional(),
    perUserLimit: z
      .number()
      .min(1, "Per user limit must be at least 1")
      .optional(),
    applicableTo: z
      .object({
        categories: z.array(z.string().uuid()).optional(),
        products: z.array(z.string().uuid()).optional(),
        brands: z.array(z.string().uuid()).optional(),
        minOrderValue: z.number().min(0).optional(),
        maxOrderValue: z.number().min(0).optional(),
      })
      .optional(),
    excludeItems: z
      .object({
        categories: z.array(z.string().uuid()).optional(),
        products: z.array(z.string().uuid()).optional(),
        brands: z.array(z.string().uuid()).optional(),
      })
      .optional(),
    startsAt: z.string().datetime("Invalid start date"),
    expiresAt: z.string().datetime("Invalid expiry date"),
    sellerId: z.string().uuid("Invalid seller ID"),
  })
  .refine(
    (data) => {
      if (data.discountType === "percentage" && data.discountValue > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    }
  )
  .refine(
    (data) => {
      const startDate = new Date(data.startsAt);
      const endDate = new Date(data.expiresAt);
      return endDate > startDate;
    },
    {
      message: "Expiry date must be after start date",
      path: ["expiresAt"],
    }
  );

// Enhanced Review Response Schema
export const reviewResponseSchema = z.object({
  reviewId: z.string().uuid("Invalid review ID"),
  response: z
    .string()
    .min(1, "Response is required")
    .max(1000, "Response too long")
    .trim(),
  isPublic: z.boolean().default(true),
  sellerId: z.string().uuid("Invalid seller ID"),
});

// Enhanced Shipping Settings Schema
export const shippingSettingsSchema = z.object({
  sellerId: z.string().uuid("Invalid seller ID"),
  freeShippingThreshold: z
    .number()
    .min(0, "Free shipping threshold must be positive")
    .max(999999.99, "Free shipping threshold too high")
    .optional(),
  defaultShippingCost: z
    .number()
    .min(0, "Default shipping cost must be positive")
    .max(999.99, "Default shipping cost too high")
    .optional(),
  shippingZones: z
    .array(
      z.object({
        zoneId: z.string().uuid("Invalid zone ID"),
        cost: z.number().min(0, "Shipping cost must be positive"),
        estimatedDays: z.number().min(1, "Estimated days must be at least 1"),
      })
    )
    .optional(),
  handlingTime: z
    .number()
    .min(1, "Handling time must be at least 1 day")
    .default(1),
  allowLocalPickup: z.boolean().default(false),
  localPickupAddress: z.string().max(500, "Address too long").optional(),
});

// Enhanced Inventory Update Schema
export const inventoryUpdateSchema = z.object({
  listingId: z.string().uuid("Invalid listing ID"),
  quantity: z.number().min(0, "Quantity must be non-negative"),
  lowStockThreshold: z
    .number()
    .min(0, "Low stock threshold must be non-negative")
    .optional(),
  isActive: z.boolean().optional(),
  price: z.number().min(0.01, "Price must be greater than 0").optional(),
  listPrice: z.number().min(0, "List price must be positive").optional(),
  salePrice: z.number().min(0, "Sale price must be positive").optional(),
  sellerId: z.string().uuid("Invalid seller ID"),
});

// Enhanced Analytics Filter Schema
export const analyticsFilterSchema = z.object({
  sellerId: z.string().uuid("Invalid seller ID"),
  startDate: z.string().datetime("Invalid start date"),
  endDate: z.string().datetime("Invalid end date"),
  categoryId: z.string().uuid("Invalid category ID").optional(),
  productId: z.string().uuid("Invalid product ID").optional(),
  status: z.enum(["all", "active", "inactive", "sold_out"]).default("all"),
  groupBy: z.enum(["day", "week", "month", "quarter", "year"]).default("day"),
});

// Enhanced Vendor Profile Schema
export const vendorProfileSchema = z.object({
  sellerId: z.string().uuid("Invalid seller ID"),
  businessName: z
    .string()
    .min(1, "Business name is required")
    .max(255, "Business name too long")
    .trim(),
  description: z.string().max(1000, "Description too long").optional(),
  logoUrl: z.string().url("Invalid logo URL").optional(),
  bannerUrl: z.string().url("Invalid banner URL").optional(),
  website: z.string().url("Invalid website URL").optional(),
  phone: z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  address: z
    .object({
      street: z.string().max(255, "Street address too long"),
      city: z.string().max(100, "City too long"),
      state: z.string().max(100, "State too long"),
      postalCode: z.string().max(20, "Postal code too long"),
      country: z.string().max(100, "Country too long"),
    })
    .optional(),
  socialMedia: z
    .object({
      facebook: z.string().url("Invalid Facebook URL").optional(),
      twitter: z.string().url("Invalid Twitter URL").optional(),
      instagram: z.string().url("Invalid Instagram URL").optional(),
      linkedin: z.string().url("Invalid LinkedIn URL").optional(),
    })
    .optional(),
  businessHours: z
    .array(
      z.object({
        day: z.enum([
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ]),
        open: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
        close: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
        isClosed: z.boolean().default(false),
      })
    )
    .optional(),
  policies: z
    .object({
      returnPolicy: z.string().max(2000, "Return policy too long").optional(),
      shippingPolicy: z
        .string()
        .max(2000, "Shipping policy too long")
        .optional(),
      privacyPolicy: z.string().max(2000, "Privacy policy too long").optional(),
      termsOfService: z
        .string()
        .max(2000, "Terms of service too long")
        .optional(),
    })
    .optional(),
});

// Enhanced Bulk Product Update Schema
export const bulkProductUpdateSchema = z.object({
  productIds: z
    .array(z.string().uuid("Invalid product ID"))
    .min(1, "At least one product ID required"),
  updates: z.object({
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isBestSeller: z.boolean().optional(),
    categoryId: z.string().uuid("Invalid category ID").optional(),
    brandId: z.string()
    // .uuid("Invalid brand ID")
    .optional(),
    price: z.number().min(0.01, "Price must be greater than 0").optional(),
    listPrice: z.number().min(0, "List price must be positive").optional(),
    salePrice: z.number().min(0, "Sale price must be positive").optional(),
    quantity: z.number().min(0, "Quantity must be non-negative").optional(),
    tags: z.array(z.string()).optional(),
  }),
  sellerId: z.string().uuid("Invalid seller ID"),
});

// Enhanced Search Schemas
export const productSearchSchema = z.object({
  sellerId: z.string().uuid("Invalid seller ID"),
  query: z.string().max(255, "Search query too long").optional(),
  category: z.string().max(255, "Category filter too long").optional(),
  brand: z.string().max(255, "Brand filter too long").optional(),
  status: z
    .enum(["all", "active", "inactive", "featured", "on_sale", "out_of_stock"])
    .default("all"),
  priceMin: z.number().min(0, "Minimum price must be positive").optional(),
  priceMax: z.number().min(0, "Maximum price must be positive").optional(),
  stockStatus: z
    .enum(["all", "in_stock", "low_stock", "out_of_stock"])
    .default("all"),
  condition: z
    .enum([
      "all",
      "new",
      "renewed",
      "refurbished",
      "used_like_new",
      "used_very_good",
      "used_good",
      "used_acceptable",
    ])
    .default("all"),
  fulfillmentType: z
    .enum(["all", "seller_fulfilled", "platform_fulfilled", "fba", "digital"])
    .default("all"),
  sortBy: z
    .enum([
      "created_at",
      "updated_at",
      "title",
      "price",
      "sales",
      "rating",
      "reviews",
    ])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1, "Page must be at least 1").default(1),
  limit: z
    .number()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(10),
  includeStats: z.boolean().default(false),
  includeVariants: z.boolean().default(false),
  includeAnalytics: z.boolean().default(false),
});

export const orderSearchSchema = z.object({
  sellerId: z.string().uuid("Invalid seller ID"),
  query: z.string().max(255, "Search query too long").optional(),
  status: z
    .enum([
      "all",
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ])
    .default("all"),
  dateFrom: z.string().datetime("Invalid start date").optional(),
  dateTo: z.string().datetime("Invalid end date").optional(),
  minAmount: z.number().min(0, "Minimum amount must be positive").optional(),
  maxAmount: z.number().min(0, "Maximum amount must be positive").optional(),
  customerEmail: z.string().email("Invalid email address").optional(),
  sortBy: z
    .enum(["created_at", "updated_at", "total_amount", "status"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1, "Page must be at least 1").default(1),
  limit: z
    .number()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(10),
  includeItems: z.boolean().default(false),
  includeCustomer: z.boolean().default(false),
});

export const couponSearchSchema = z.object({
  sellerId: z.string().uuid("Invalid seller ID"),
  query: z.string().max(255, "Search query too long").optional(),
  status: z
    .enum(["all", "active", "inactive", "expired", "upcoming"])
    .default("all"),
  discountType: z
    .enum(["all", "percentage", "fixed_amount", "buy_x_get_y", "free_shipping"])
    .default("all"),
  dateFrom: z.string().datetime("Invalid start date").optional(),
  dateTo: z.string().datetime("Invalid end date").optional(),
  sortBy: z
    .enum(["created_at", "expires_at", "usage_count", "discount_value"])
    .default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1, "Page must be at least 1").default(1),
  limit: z
    .number()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(10),
  includeUsage: z.boolean().default(false),
});

// Type exports
export type ProductFormData = z.infer<typeof productSchema>;
export type ProductVariantFormData = z.infer<typeof productVariantSchema>;
export type ProductListingFormData = z.infer<typeof productListingSchema>;
export type OrderUpdateFormData = z.infer<typeof orderUpdateSchema>;
export type OrderItemUpdateFormData = z.infer<typeof orderItemUpdateSchema>;
export type CouponFormData = z.infer<typeof couponSchema>;
export type ReviewResponseFormData = z.infer<typeof reviewResponseSchema>;
export type ShippingSettingsFormData = z.infer<typeof shippingSettingsSchema>;
export type InventoryUpdateFormData = z.infer<typeof inventoryUpdateSchema>;
export type AnalyticsFilterFormData = z.infer<typeof analyticsFilterSchema>;
export type VendorProfileFormData = z.infer<typeof vendorProfileSchema>;
export type BulkProductUpdateFormData = z.infer<typeof bulkProductUpdateSchema>;
export type ProductSearchFormData = z.infer<typeof productSearchSchema>;
export type OrderSearchFormData = z.infer<typeof orderSearchSchema>;
export type CouponSearchFormData = z.infer<typeof couponSearchSchema>;
