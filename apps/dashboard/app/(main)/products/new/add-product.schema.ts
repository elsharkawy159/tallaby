import { z } from "zod";

// Main product schema based on database structure
export const addProductFormSchema = z.object({
  // Basic Information
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

  // Product ID/SKU
  productId: z.string().optional(), // For display purposes, auto-generated

  // Categories & Brand
  mainCategoryId: z.string().min(1, "Main category is required"),
  brandId: z.string().optional(),

  // Pricing
  basePrice: z.number().min(0.01, "Base price must be greater than 0"),
  listPrice: z.number().optional(),
  salePrice: z.number().optional(),

  // Inventory
  stockQuantity: z
    .number()
    .min(0, "Stock quantity must be 0 or greater")
    .default(0),
  sku: z.string().optional(), // Auto-generated if not provided

  // Product Images
  images: z
    .array(
      z.object({
        url: z.string().url("Invalid image URL"),
        altText: z.string().optional(),
        isPrimary: z.boolean().default(false),
        position: z.number().default(0),
      })
    )
    .optional(),

  // Product Flags/Settings
  isActive: z.boolean().default(true),
  isAdult: z.boolean().default(false),
  isPlatformChoice: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),

  // Tax & Shipping
  taxClass: z
    .enum(["standard", "reduced", "zero", "exempt"])
    .default("standard"),
  weight: z.number().optional(),
  dimensions: z
    .object({
      length: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),

  // SEO
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  searchKeywords: z.string().optional(),

  // Listing Information
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
  handlingTime: z
    .number()
    .min(1, "Handling time must be at least 1 day")
    .default(1),
  maxOrderQuantity: z.number().optional(),
});

// Default values for the form
export const defaultValues: Partial<AddProductFormData> = {
  title: "",
  slug: "",
  description: "",
  bulletPoints: [],
  brandId: "",
  mainCategoryId: "",
  basePrice: 0,
  listPrice: undefined,
  salePrice: undefined,
  stockQuantity: 0,
  sku: "",
  images: [],
  isActive: true,
  isAdult: false,
  isPlatformChoice: false,
  isBestSeller: false,
  taxClass: "standard",
  weight: undefined,
  dimensions: {
    length: undefined,
    width: undefined,
    height: undefined,
  },
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  searchKeywords: "",
  condition: "new",
  fulfillmentType: "seller_fulfilled",
  handlingTime: 1,
  maxOrderQuantity: undefined,
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
}

export interface BrandOption {
  id: string;
  name: string;
  slug: string;
  isVerified: boolean;
}

// Image upload types
export interface ProductImage {
  url: string;
  altText?: string;
  isPrimary: boolean;
  position: number;
  file?: File; // For new uploads
}

// Form step types for multi-step form
export type FormStep = "basic" | "images" | "pricing" | "settings" | "seo";

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
    title: "Pricing & Inventory",
    description: "Set prices and stock levels",
    fields: ["basePrice", "listPrice", "salePrice", "stockQuantity", "sku"],
  },
  {
    id: "settings",
    title: "Product Settings",
    description: "Configure product options",
    fields: [
      "isActive",
      "isAdult",
      "isPlatformChoice",
      "isBestSeller",
      "condition",
      "fulfillmentType",
      "handlingTime",
      "maxOrderQuantity",
      "taxClass",
      "weight",
      "dimensions",
    ],
  },
  {
    id: "seo",
    title: "SEO & Marketing",
    description: "Search engine optimization",
    fields: ["metaTitle", "metaDescription", "metaKeywords", "searchKeywords"],
  },
];
