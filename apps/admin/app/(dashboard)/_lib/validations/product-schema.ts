import * as z from "zod";

// Product validation schema
export const productSchema = z.object({
  title: z
    .string()
    .min(3, "Product title must be at least 3 characters")
    .max(255, "Product title must be less than 255 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(255, "Slug must be less than 255 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be in URL-friendly format"),
  description: z.string().optional(),
  bulletPoints: z.array(z.string()).optional(),
  brandId: z.string().uuid("Brand ID must be a valid UUID"),
  mainCategoryId: z.string().uuid("Main category ID must be a valid UUID"),
  basePrice: z
    .number()
    .min(0.01, "Base price must be greater than 0")
    .max(1000000, "Base price must be less than 1,000,000"),
  listPrice: z
    .number()
    .min(0.01, "List price must be greater than 0")
    .max(1000000, "List price must be less than 1,000,000")
    .optional(),
  isActive: z.boolean().default(true),
  isAdult: z.boolean().default(false),
  isPlatformChoice: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  taxClass: z.string().default("standard"),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().max(1000).optional(),
  metaKeywords: z.string().max(255).optional(),
  searchKeywords: z.string().max(500).optional(),
  additionalCategories: z.array(z.string().uuid()).optional(),
});

// Product variant validation schema
export const productVariantSchema = z.object({
  sku: z
    .string()
    .min(3, "SKU must be at least 3 characters")
    .max(50, "SKU must be less than 50 characters"),
  name: z
    .string()
    .min(1, "Variant name is required")
    .max(255, "Variant name must be less than 255 characters"),
  attributes: z.record(z.string(), z.string()),
  price: z
    .number()
    .min(0.01, "Price must be greater than 0")
    .max(1000000, "Price must be less than 1,000,000"),
  listPrice: z
    .number()
    .min(0.01, "List price must be greater than 0")
    .max(1000000, "List price must be less than 1,000,000")
    .optional(),
  isDefault: z.boolean().default(false),
  weight: z.number().min(0).optional(),
  dimensions: z
    .object({
      length: z.number().min(0).optional(),
      width: z.number().min(0).optional(),
      height: z.number().min(0).optional(),
      unit: z.string().default("cm"),
    })
    .optional(),
  isActive: z.boolean().default(true),
});

// Product listing validation schema
export const productListingSchema = z.object({
  productId: z.string().uuid("Product ID must be a valid UUID"),
  variantId: z.string().uuid("Variant ID must be a valid UUID").optional(),
  sellerId: z.string().uuid("Seller ID must be a valid UUID"),
  sku: z
    .string()
    .min(3, "SKU must be at least 3 characters")
    .max(50, "SKU must be less than 50 characters"),
  condition: z.enum([
    "new",
    "renewed",
    "refurbished",
    "used_like_new",
    "used_very_good",
    "used_good",
    "used_acceptable",
  ]),
  conditionDescription: z.string().max(1000).optional(),
  price: z
    .number()
    .min(0.01, "Price must be greater than 0")
    .max(1000000, "Price must be less than 1,000,000"),
  salePrice: z
    .number()
    .min(0.01, "Sale price must be greater than 0")
    .max(1000000, "Sale price must be less than 1,000,000")
    .optional(),
  quantity: z.number().int().min(0).default(0),
  fulfillmentType: z.enum([
    "seller_fulfilled",
    "platform_fulfilled",
    "fba",
    "digital",
  ]),
  handlingTime: z.number().int().min(0).default(1),
  restockDate: z.date().optional(),
  maxOrderQuantity: z.number().int().min(1).optional(),
  isFeatured: z.boolean().default(false),
  isBuyBox: z.boolean().default(false),
  isActive: z.boolean().default(true),
  notes: z.string().max(1000).optional(),
});
