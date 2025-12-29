import { z } from "zod";

// Product schema aligned with DB products + product_variants
export const addProductFormSchema = z.object({
  // products
  title: z.string().min(1, "Product name is required").max(255),
  slug: z.string().min(1, "Product slug is required").max(255),
  description: z.string().optional(),
  bulletPoints: z.array(z.string()).optional(),

  categoryId: z.string().min(1, "Main category is required"),
  brandId: z.string().optional(),

  sku: z.string().min(1, "SKU is required"),
  quantity: z.number().int().min(0).default(0),
  maxOrderQuantity: z.number().int().optional(),

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

  images: z.array(z.string()).min(1, "At least one product image is required"),

  price: z.object({
    base: z.number().min(0.01, "Base price must be greater than 0"),
    list: z.number().min(0.01, "List price must be greater than 0"),
    discountValue: z.number().optional(),
    discountType: z.enum(["amount", "percent"]).default("amount").optional(),
    final: z.number().min(0.01, "Final price must be greater than 0"),
  }),

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
  handlingTime: z.number().int().min(1).default(1),

  isActive: z.boolean().default(true),
  isPlatformChoice: z.boolean().default(false),
  isMostSelling: z.boolean().default(false),
  isFeatured: z.boolean().default(false),

  taxClass: z
    .enum(["standard", "reduced", "zero", "exempt"])
    .default("standard"),

  seo: z
    .object({
      metaTitle: z.string().max(60).optional(),
      metaDescription: z.string().max(160).optional(),
      metaKeywords: z.string().optional(),
      searchKeywords: z.string().optional(),
    })
    .optional(),

  notes: z.string().optional(),

  // product_variants
  variants: z
    .array(
      z.object({
        title: z.string().min(1, "Variant title is required").max(255),
        sku: z.string().min(1, "Variant SKU is required").max(100),
        price: z.number().min(0.01, "Price must be greater than 0"),
        stock: z.number().int().min(0).default(0),
        imageUrl: z.string().url().optional(),
        option1: z.string().optional(),
        option2: z.string().optional(),
        option3: z.string().optional(),
        barCode: z.string().optional(),
        position: z.number().int().min(1).optional(),
      })
    )
    .optional(),
});

export const defaultValues: Partial<AddProductFormData> = {
  title: "",
  slug: "",
  description: "",
  bulletPoints: [],
  brandId: undefined,
  categoryId: "",
  sku: "",
  quantity: 0,
  maxOrderQuantity: undefined,
  dimensions: {
    length: undefined,
    width: undefined,
    height: undefined,
    weight: undefined,
    unit: "cm",
    weightUnit: "kg",
  },
  images: [],
  price: {
    base: undefined as unknown as number,
    list: undefined as unknown as number,
    discountValue: undefined,
    discountType: "percent",
    final: undefined as unknown as number,
  },
  condition: "new",
  conditionDescription: "",
  fulfillmentType: "platform_fulfilled",
  handlingTime: 1,
  isActive: false,
  isPlatformChoice: false,
  isMostSelling: false,
  isFeatured: false,
  taxClass: "standard",
  seo: {
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    searchKeywords: "",
  },
  notes: "",
  variants: [],
};

export type AddProductFormData = z.infer<typeof addProductFormSchema>;

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
  logoUrl?: string | null;
  description?: string;
  website?: string | null;
  isVerified: boolean;
  isOfficial?: boolean;
  averageRating?: number | null;
  reviewCount?: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductImage {
  url: string;
}

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
  { value: "g", label: "Grams (g)" },
];
