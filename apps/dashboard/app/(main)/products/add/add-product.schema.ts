import { z } from "zod";

export const SUPPORTED_LOCALES = ["en", "ar"] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const localizedFieldsSchema = z.object({
  title: z.string().max(255),
  slug: z.string().max(255),
  description: z.string().optional(),
  bulletPoints: z.array(z.string()).max(10).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
})

export type LocalizedFields = z.infer<typeof localizedFieldsSchema>

// Product schema: shared fields + localized fields per locale shared fields + localized fields per locale
export const addProductFormSchema = z
  .object({
    productUrl: z.preprocess(
      (val) => {
        if (typeof val !== "string") return val
        const trimmed = val.trim()
        return trimmed === "" ? undefined : trimmed
      },
      z.string().url("Please enter a valid URL").optional()
    ),

    // shared fields
    categoryId: z.string().min(1, "Main category is required"),
    brandId: z.string().optional(),
    sku: z.string().optional(),
    quantity: z.number().int().min(0).default(0),
    maxOrderQuantity: z.number().int().optional(),
    images: z.array(z.string()).min(1, "At least one product image is required"),
    price: z.object({
      base: z.number().min(0.01, "Base price must be greater than 0").optional(),
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
    variants: z
      .array(
        z.object({
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
        })
      )
      .optional(),
    notes: z.string().optional(),

    // localized: Record<locale, { title, description, bullet_points, slug, meta_title, meta_description }>
    localized: z.object({
      en: localizedFieldsSchema,
      ar: localizedFieldsSchema,
    }),
  })
  .superRefine((data, ctx) => {
    // EN title is always required
    const enTitle = (data.localized?.en?.title ?? "").trim()
    if (!enTitle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Product name (EN) is required",
        path: ["localized", "en", "title"],
      })
    }

    // EN slug is required if EN title exists
    const enSlug = (data.localized?.en?.slug ?? "").trim()
    if (enTitle && !enSlug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Product slug (EN) is required",
        path: ["localized", "en", "slug"],
      })
    }

    // If AR has any non-empty localized field, AR title is required
    const ar = data.localized?.ar ?? {}
    const arHasContent =
      (ar.title ?? "").trim() !== "" ||
      (ar.description ?? "").trim() !== "" ||
      (ar.slug ?? "").trim() !== "" ||
      ((ar.bulletPoints ?? []).length > 0) ||
      (ar.metaTitle ?? "").trim() !== "" ||
      (ar.metaDescription ?? "").trim() !== ""

    if (arHasContent && !(ar.title ?? "").trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Arabic title is required when Arabic content is provided",
        path: ["localized", "ar", "title"],
      })
    }
  })

export const defaultLocalizedFields = (): LocalizedFields => ({
  title: "",
  slug: "",
  description: "",
  bulletPoints: [],
  metaTitle: "",
  metaDescription: "",
})

export const defaultValues = {
  productUrl: "",
  categoryId: "",
  brandId: undefined,
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
    list: undefined as unknown as number,
    discountValue: undefined,
    discountType: "percent" as const,
    final: undefined as unknown as number,
  },
  condition: "new" as const,
  conditionDescription: "",
  fulfillmentType: "platform_fulfilled" as const,
  handlingTime: 1,
  isPlatformChoice: false,
  isMostSelling: false,
  isFeatured: false,
  taxClass: "standard" as const,
  notes: "",
  variants: [],
  localized: {
    en: defaultLocalizedFields(),
    ar: defaultLocalizedFields(),
  },
}

export type AddProductFormData = z.infer<typeof addProductFormSchema>

export interface CategoryOption {
  id: string
  name: string
  nameAr?: string | null
  slug: string
  level: number
  parentId?: string
  description?: string
}

export interface BrandOption {
  id: string
  name: string
  slug: string
  logoUrl?: string | null
  description?: string
  website?: string | null
  isVerified: boolean
  isOfficial?: boolean
  averageRating?: number | null
  reviewCount?: number
  productCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface ProductImage {
  url: string
}

export function validateImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.onerror = () => reject(new Error("Invalid image file"))
    img.src = URL.createObjectURL(file)
  })
}

export const conditionOptions = [
  { value: "new", label: "New" },
  { value: "renewed", label: "Renewed" },
  { value: "refurbished", label: "Refurbished" },
  { value: "used_like_new", label: "Used - Like New" },
  { value: "used_very_good", label: "Used - Very Good" },
  { value: "used_good", label: "Used - Good" },
  { value: "used_acceptable", label: "Used - Acceptable" },
]

export const fulfillmentOptions = [
  { value: "platform_fulfilled", label: "Platform Fulfilled" },
  { value: "seller_fulfilled", label: "Seller Fulfilled" },
]

export const taxClassOptions = [
  { value: "standard", label: "Standard Tax Rate" },
  { value: "reduced", label: "Reduced Tax Rate" },
  { value: "zero", label: "Zero Tax Rate" },
  { value: "exempt", label: "Tax Exempt" },
]

export const dimensionUnits = [
  { value: "cm", label: "Centimeters (cm)" },
  { value: "in", label: "Inches (in)" },
]

/** Returns true if the locale has missing required localized fields */
export function isLocaleMissingRequiredFields(
  locale: SupportedLocale,
  data: Partial<LocalizedFields>
): boolean {
  const title = (data?.title ?? "").trim()
  if (locale === "en") return !title
  if (locale === "ar") {
    const hasAnyArContent =
      title !== "" ||
      (data?.description ?? "").trim() !== "" ||
      (data?.slug ?? "").trim() !== "" ||
      ((data?.bulletPoints ?? []).length > 0) ||
      (data?.metaTitle ?? "").trim() !== "" ||
      (data?.metaDescription ?? "").trim() !== ""
    return hasAnyArContent && !title
  }
  return false
}

export const weightUnits = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "lb", label: "Pounds (lb)" },
  { value: "g", label: "Grams (g)" },
]
