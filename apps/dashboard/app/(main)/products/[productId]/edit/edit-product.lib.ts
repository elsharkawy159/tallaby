import { defaultLocalizedFields } from "../../add/add-product.schema";
import type { AddProductFormData } from "../../add/add-product.schema";

type ProductForEdit = {
  id: string;
  categoryId: string;
  brandId: string | null;
  sku: string | null;
  quantity: string | number;
  maxOrderQuantity: number | null;
  images: unknown;
  price: unknown;
  condition: string | null;
  conditionDescription: string | null;
  fulfillmentType: string | null;
  handlingTime: string | number | null;
  isActive: boolean | null;
  isPlatformChoice: boolean | null;
  isMostSelling: boolean | null;
  isFeatured: boolean | null;
  taxClass: string | null;
  dimensions: unknown;
  localized: AddProductFormData["localized"];
  productVariants?: Array<{
    title: string;
    sku: string;
    price: unknown;
    stock?: number;
    imageUrl?: string | null;
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
    barCode?: string | null;
    position?: number | null;
  }>;
};

const safeNum = (v: unknown): number | undefined =>
  v != null && typeof v === "number" && Number.isFinite(v) ? v : undefined;

export function buildEditDefaultValues(
  product: ProductForEdit
): AddProductFormData {
  const priceObj =
    product.price && typeof product.price === "object"
      ? (product.price as Record<string, unknown>)
      : {};
  const list = safeNum(priceObj.list ?? priceObj.base) ?? 1;
  const final = safeNum(priceObj.final) ?? list;
  const base = safeNum(priceObj.base) ?? list;
  const quantity =
    typeof product.quantity === "string"
      ? parseInt(product.quantity, 10) || 0
      : typeof product.quantity === "number"
        ? product.quantity
        : 0;

  const images = Array.isArray(product.images)
    ? (product.images as string[]).filter(
        (x): x is string => typeof x === "string"
      )
    : [];

  const dimensions =
    product.dimensions && typeof product.dimensions === "object"
      ? (product.dimensions as Record<string, unknown>)
      : {};
  const variants = (product.productVariants ?? []).map((v) => ({
    title: v.title ?? "",
    sku: v.sku ?? "",
    price: typeof v.price === "number" ? v.price : Number(v.price) || 0,
    stock: typeof v.stock === "number" ? v.stock : 0,
    imageUrl: v.imageUrl ?? undefined,
    option1: v.option1 ?? undefined,
    option2: v.option2 ?? undefined,
    option3: v.option3 ?? undefined,
    barCode: v.barCode ?? undefined,
    position: v.position ?? undefined,
  }));

  return {
    productUrl: "",
    categoryId: product.categoryId ?? "",
    brandId: product.brandId ?? undefined,
    sku: product.sku ?? "",
    quantity,
    maxOrderQuantity: product.maxOrderQuantity ?? undefined,
    dimensions: {
      length: safeNum(dimensions.length),
      width: safeNum(dimensions.width),
      height: safeNum(dimensions.height),
      weight: safeNum(dimensions.weight),
      unit: (dimensions.unit as string) ?? "cm",
      weightUnit: (dimensions.weightUnit as string) ?? "kg",
    },
    images: images.length > 0 ? images : [],
    price: {
      base,
      list,
      discountValue: safeNum(priceObj.discountValue),
      discountType:
        (priceObj.discountType as "amount" | "percent") ?? "percent",
      final: final >= 0.01 ? final : list,
    },
    condition: (product.condition as AddProductFormData["condition"]) ?? "new",
    conditionDescription: product.conditionDescription ?? "",
    fulfillmentType:
      (product.fulfillmentType as AddProductFormData["fulfillmentType"]) ??
      "platform_fulfilled",
    handlingTime:
      typeof product.handlingTime === "string"
        ? parseInt(product.handlingTime, 10) || 1
        : (product.handlingTime ?? 1),
    isPlatformChoice: product.isPlatformChoice ?? false,
    isMostSelling: product.isMostSelling ?? false,
    isFeatured: product.isFeatured ?? false,
    taxClass:
      (product.taxClass as AddProductFormData["taxClass"]) ?? "standard",
    notes: "",
    variants,
    localized: {
      en: product.localized?.en
        ? {
            title: product.localized.en.title ?? "",
            slug: product.localized.en.slug ?? "",
            description: product.localized.en.description ?? "",
            bulletPoints: Array.isArray(product.localized.en.bulletPoints)
              ? product.localized.en.bulletPoints
              : [],
            metaTitle: product.localized.en.metaTitle ?? "",
            metaDescription: product.localized.en.metaDescription ?? "",
          }
        : defaultLocalizedFields(),
      ar: product.localized?.ar
        ? {
            title: product.localized.ar.title ?? "",
            slug: product.localized.ar.slug ?? "",
            description: product.localized.ar.description ?? "",
            bulletPoints: Array.isArray(product.localized.ar.bulletPoints)
              ? product.localized.ar.bulletPoints
              : [],
            metaTitle: product.localized.ar.metaTitle ?? "",
            metaDescription: product.localized.ar.metaDescription ?? "",
          }
        : defaultLocalizedFields(),
    },
  };
}
