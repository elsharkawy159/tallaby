import { z } from "zod";

// Product schema matching the database products table structure
export const addProductFormSchema = z.object({
  // ===== BASIC PRODUCT INFORMATION =====
  title: z
    .string()
    .min(1, "Product name is required")
    .max(255, "Product name must be less than 255 characters"),
  slug: z
    .string()
    .min(1, "Product slug is required")
    .max(255, "Slug must be less than 255 characters"),
  description: z.string().optional(),
  bulletPoints: z.array(z.string()).optional(),

  // ===== CATEGORIES & BRAND =====
  mainCategoryId: z.string().min(1, "Main category is required"),
  brandId: z.string().optional(),

  // ===== INVENTORY & SKU =====
  sku: z.string().min(1, "SKU is required"),
  quantity: z
    .number()
    .int()
    .min(0, "Stock quantity must be 0 or greater")
    .default(0),
  maxOrderQuantity: z.number().int().optional(),

  // ===== PHYSICAL DIMENSIONS =====
  dimensionUnits: z
    .object({
      length: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      weight: z.number().optional(),
      unit: z.enum(["cm", "in"]).default("cm"),
      weightUnit: z.enum(["kg", "lb"]).default("kg"),
    })
    .optional(),

  // ===== PRODUCT IMAGES (JSONB) =====
  images: z
    .array(z.string())
    .min(1, "At least one product image is required"),

  // ===== PRICING =====
  basePrice: z.number().min(0.01, "Base price must be greater than 0"),
  listPrice: z.number().optional(),
  salePrice: z.number().optional(),

  // ===== CONDITION & FULFILLMENT =====
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
  conditionDescription: z.string().optional(),
  fulfillmentType: z
    .enum(["seller_fulfilled", "platform_fulfilled", "fba", "digital"])
    .default("seller_fulfilled"),
  handlingTime: z
    .number()
    .int()
    .min(1, "Handling time must be at least 1 day")
    .default(1),

  // ===== PRODUCT STATUS FLAGS =====
  isActive: z.boolean().default(false),
  isAdult: z.boolean().default(false),
  isPlatformChoice: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isBuyBox: z.boolean().default(false),

  // ===== RATINGS & REVIEWS =====
  averageRating: z.number().optional(),
  reviewCount: z.number().int().default(0),
  totalQuestions: z.number().int().default(0),

  // ===== TAX & LEGAL =====
  taxClass: z
    .enum(["standard", "reduced", "zero", "exempt"])
    .default("standard"),

  // ===== SEO & MARKETING =====
  metaTitle: z
    .string()
    .max(60, "Meta title should be under 60 characters")
    .optional(),
  metaDescription: z
    .string()
    .max(160, "Meta description should be under 160 characters")
    .optional(),
  metaKeywords: z.string().optional(),
  searchKeywords: z.string().optional(),

  // ===== NOTES & ADDITIONAL INFO =====
  notes: z.string().optional(),
});

// Default values matching the updated schema
export const defaultValues: Partial<AddProductFormData> = {
  title: "",
  slug: "",
  description: "",
  bulletPoints: [],
  brandId: "",
  mainCategoryId: "",
  sku: "",
  quantity: 0,
  maxOrderQuantity: undefined,
  dimensionUnits: {
    length: undefined,
    width: undefined,
    height: undefined,
    weight: undefined,
    unit: "cm",
    weightUnit: "kg",
  },
  images: [],
  basePrice: undefined,
  listPrice: undefined,
  salePrice: undefined,
  condition: "new",
  conditionDescription: "",
  fulfillmentType: "platform_fulfilled",
  handlingTime: 1,
  isActive: false,
  isAdult: false,
  isPlatformChoice: false,
  isBestSeller: false,
  isFeatured: false,
  isBuyBox: false,
  averageRating: undefined,
  reviewCount: 0,
  totalQuestions: 0,
  taxClass: "standard",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  searchKeywords: "",
  notes: "",
};

// Infer TypeScript type from schema
export type AddProductFormData = z.infer<typeof addProductFormSchema>;

// Category and Brand types
export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId?: string;
  description?: string;
}

export interface BrandOption {
  id: string;
  name: string;
  slug: string;
  isVerified: boolean;
  logoUrl?: string;
}

// Enhanced image types - simplified for string URLs
export interface ProductImage {
  url: string;
  // Note: For now, we're using simple string URLs
  // This can be enhanced later to include alt text, position, etc.
}

// Form validation helpers
export const validateImageDimensions = (
  file: File
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => reject(new Error("Invalid image file"));
    img.src = URL.createObjectURL(file);
  });
};

// Form step configuration for multi-step form
export type FormStep =
  | "basic"
  | "images"
  | "pricing"
  | "inventory"
  | "settings"
  | "seo";

export interface FormStepConfig {
  id: FormStep;
  title: string;
  description: string;
  fields: string[];
}

export const formSteps: FormStepConfig[] = [
  {
    id: "basic",
    title: "Basic Information",
    description: "Product name, description, and category",
    fields: [
      "title",
      "slug",
      "description",
      "bulletPoints",
      "mainCategoryId",
      "brandId",
    ],
  },
  {
    id: "images",
    title: "Product Images",
    description: "Upload product photos",
    fields: ["images"],
  },
  {
    id: "pricing",
    title: "Pricing",
    description: "Set product prices",
    fields: ["basePrice", "listPrice", "salePrice"],
  },
  {
    id: "inventory",
    title: "Inventory & Stock",
    description: "Manage stock levels and SKU",
    fields: ["sku", "quantity", "maxOrderQuantity", "dimensionUnits"],
  },
  {
    id: "settings",
    title: "Product Settings",
    description: "Condition, fulfillment, and status",
    fields: [
      "condition",
      "conditionDescription",
      "fulfillmentType",
      "handlingTime",
      "isActive",
      "isAdult",
      "isPlatformChoice",
      "isBestSeller",
      "isFeatured",
      "isBuyBox",
      "taxClass",
    ],
  },
  {
    id: "seo",
    title: "SEO & Marketing",
    description: "Search engine optimization and notes",
    fields: [
      "metaTitle",
      "metaDescription",
      "metaKeywords",
      "searchKeywords",
      "notes",
    ],
  },
];

// Option configurations for select fields
export const conditionOptions = [
  { value: "new", label: "New" },
  { value: "renewed", label: "Renewed" },
  { value: "refurbished", label: "Refurbished" },
  { value: "used_like_new", label: "Used - Like New" },
  { value: "used_very_good", label: "Used - Very Good" },
  { value: "used_good", label: "Used - Good" },
  { value: "used_acceptable", label: "Used - Acceptable" },
];

export const fulfillmentOptions = [
  { value: "platform_fulfilled", label: "Platform Fulfilled" },
  { value: "seller_fulfilled", label: "Seller Fulfilled" },
  // { value: "fba", label: "FBA (Fulfillment by Amazon)" },
  // { value: "digital", label: "Digital Download" },
];

export const taxClassOptions = [
  { value: "standard", label: "Standard Tax Rate" },
  { value: "reduced", label: "Reduced Tax Rate" },
  { value: "zero", label: "Zero Tax Rate" },
  { value: "exempt", label: "Tax Exempt" },
];

export const dimensionUnits = [
  { value: "cm", label: "Centimeters (cm)" },
  { value: "in", label: "Inches (in)" },
];

export const weightUnits = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "lb", label: "Pounds (lb)" },
];
