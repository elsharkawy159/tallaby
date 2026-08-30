import * as z from "zod";

const productVariantFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Variant title is required").max(255),
  sku: z.string().min(1, "Variant SKU is required").max(100),
  price: z.number().min(0.01, "Price must be greater than 0"),
  stock: z.number().int().min(0).default(0),
  imageUrl: z.string().optional(),
  option1: z.string().optional(),
  option2: z.string().optional(),
  option3: z.string().optional(),
  barCode: z.string().optional(),
  position: z.number().int().min(1).optional(),
});

export const productSchema = z
  .object({
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
    bulletPoints: z.array(z.string()).default([]),
    brandId: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().uuid("Brand ID must be a valid UUID").optional()
    ),
    categoryId: z.string().uuid("Category ID must be a valid UUID"),
    sku: z.string().max(100).optional(),
    basePrice: z
      .number()
      .min(0.01, "Base price must be greater than 0")
      .max(1000000, "Base price must be less than 1,000,000"),
    listPrice: z
      .number()
      .min(0.01, "List price must be greater than 0")
      .max(1000000, "List price must be less than 1,000,000")
      .optional(),
    finalPrice: z
      .number()
      .min(0.01, "Final price must be greater than 0")
      .max(1000000, "Final price must be less than 1,000,000"),
    quantity: z.number().int().min(0).default(0),
    images: z.array(z.string()).default([]),
    status: z.enum(["draft", "pending", "active", "rejected"]).default("pending"),
    isPlatformChoice: z.boolean().default(false),
    isBestSeller: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
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
    conditionDescription: z.string().max(1000).optional(),
    fulfillmentType: z
      .enum(["seller_fulfilled", "platform_fulfilled", "fba", "digital"])
      .default("seller_fulfilled"),
    handlingTime: z.number().int().min(1).default(1),
    maxOrderQuantity: z.number().int().min(1).optional(),
    taxClass: z.enum(["standard", "reduced", "zero", "exempt"]).default("standard"),
    dimensions: z
      .object({
        length: z.number().optional(),
        width: z.number().optional(),
        height: z.number().optional(),
        weight: z.number().optional(),
        unit: z.enum(["cm", "in"]).default("cm").optional(),
        weightUnit: z.enum(["kg", "g", "lb"]).default("kg").optional(),
      })
      .optional(),
    variants: z.array(productVariantFormSchema).optional(),
    metaTitle: z.string().max(255).optional(),
    metaDescription: z.string().max(1000).optional(),
    locale: z.enum(["en", "ar"]).default("en"),
  })
  .superRefine((data, ctx) => {
    if (data.status === "active" && data.images.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one product image is required for active products",
        path: ["images"],
      });
    }
  });

export const productVariantSchema = productVariantFormSchema;

// Legacy listing schema kept for reference in other admin modules
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
  locale: z.enum(["en", "ar"]).default("en"),
});
