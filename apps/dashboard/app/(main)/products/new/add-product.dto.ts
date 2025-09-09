import { z } from "zod";

// Enhanced product schema with comprehensive validation
export const addProductSchema = z
  .object({
    // Basic Product Information
    title: z
      .string()
      .min(3, "Product title must be at least 3 characters")
      .max(255, "Product title must be less than 255 characters")
      .trim(),

    slug: z
      .string()
      .min(3, "Product slug must be at least 3 characters")
      .max(255, "Product slug must be less than 255 characters")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens"
      )
      .trim(),

    description: z
      .string()
      .max(2000, "Description must be less than 2000 characters")
      .optional(),

    bulletPoints: z
      .array(
        z
          .string()
          .min(1, "Bullet point cannot be empty")
          .max(200, "Bullet point too long")
      )
      .max(10, "Maximum 10 bullet points allowed")
      .optional(),

    // Category & Brand
    categoryId: z.string().min(1, "Main category is required"),
    brandId: z.string().optional(),

    // Pricing
    basePrice: z
      .number()
      .min(0.01, "Base price must be greater than 0")
      .max(999999.99, "Base price too high"),

    listPrice: z
      .number()
      .min(0, "List price must be positive")
      .max(999999.99, "List price too high")
      .optional(),

    // Product Flags
    isActive: z.boolean().default(true),
    isAdult: z.boolean().default(false),
    isPlatformChoice: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    taxClass: z
      .enum(["standard", "reduced", "zero", "exempt"])
      .default("standard"),

    // SEO & Metadata
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

    // Images & Media
    images: z
      .array(z.string().url("Invalid image URL"))
      .min(1, "At least one product image is required")
      .max(10, "Maximum 10 images allowed"),

    // Tags
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

// Product variant schema
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

// Product listing schema
export const productListingSchema = z
  .object({
    variantId: z.string().optional(),

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

    handlingTime: z
      .number()
      .min(1, "Handling time must be at least 1 day")
      .max(30, "Handling time cannot exceed 30 days")
      .optional(),

    isActive: z.boolean().default(true),
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

// Complete form schema combining all parts
export const completeProductSchema = addProductSchema.and(
  z.object({
    variants: z.array(productVariantSchema).optional(),
    listings: z.array(productListingSchema).optional(),
  })
);

// Image upload schema
export const imageUploadSchema = z.object({
  file: z.instanceof(File, { message: "File is required" }),
});

// Slug availability check schema
export const slugCheckSchema = z.object({
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
});

// Category and brand schemas
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  level: z.number(),
  parentId: z.string().optional(),
});

export const brandSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().optional(),
  isVerified: z.boolean(),
});

// Response schemas
export const actionResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  errors: z.record(z.string()).optional(),
});

// Type exports
export type AddProductFormDTO = z.infer<typeof addProductSchema>;
export type ProductVariantDTO = z.infer<typeof productVariantSchema>;
export type ProductListingDTO = z.infer<typeof productListingSchema>;
export type CompleteProductDTO = z.infer<typeof completeProductSchema>;
export type ImageUploadDTO = z.infer<typeof imageUploadSchema>;
export type SlugCheckDTO = z.infer<typeof slugCheckSchema>;
export type CategoryDTO = z.infer<typeof categorySchema>;
export type BrandDTO = z.infer<typeof brandSchema>;
export type ActionResultDTO = z.infer<typeof actionResultSchema>;
