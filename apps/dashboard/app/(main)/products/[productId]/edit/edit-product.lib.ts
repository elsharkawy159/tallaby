import { defaultLocalizedFields } from "../../add/add-product.schema";
import type { AddProductFormData } from "../../add/add-product.schema";
import {
  calculateDiscountFromFinalPrice,
  type SellerPricingSettings,
} from "@/lib/utils/product-pricing.lib";
import {
  reconstructVariantTypesFromVariants,
  type VariantLocalizedMap,
} from "@/lib/utils/variant-types.lib";

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
  isPlatformChoice: boolean | null;
  isMostSelling: boolean | null;
  isFeatured: boolean | null;
  isTrending: boolean | null;
  isSeasonal: boolean | null;
  freeDelivery: boolean | null;
  taxClass: string | null;
  dimensions: unknown;
  localized: AddProductFormData["localized"];
  productVariants?: Array<{
    title: string;
    sku: string;
    price: unknown;
    stock?: number;
    images?: string[] | null;
    imageUrl?: string | null;
    isDefault?: boolean | null;
    localized?: unknown;
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
  product: ProductForEdit,
  sellerPricing?: SellerPricingSettings
): AddProductFormData {
  const priceObj =
    product.price && typeof product.price === "object"
      ? (product.price as Record<string, unknown>)
      : {};
  const list = safeNum(priceObj.list ?? priceObj.base) ?? 1;
  const final = safeNum(priceObj.final) ?? list;
  const base = safeNum(priceObj.base) ?? list;
  const discountValue = safeNum(priceObj.discountValue);
  const discountType =
    (priceObj.discountType as "amount" | "percent") ?? "percent";
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

  const rawVariants = product.productVariants ?? [];
  const variantTypes = reconstructVariantTypesFromVariants(rawVariants);

  const variants = rawVariants.map((v) => {
    const isDefault = v.isDefault === true;
    const variantFinal =
      typeof v.price === "number" ? v.price : Number(v.price) || 0;
    const variantImages = isDefault
      ? images
      : Array.isArray(v.images)
        ? v.images.filter(
            (img): img is string => typeof img === "string" && img.length > 0
          )
        : v.imageUrl
          ? [v.imageUrl]
          : [];
    const inferredDiscount =
      sellerPricing && !isDefault && variantFinal > 0
        ? calculateDiscountFromFinalPrice(
            list,
            variantFinal,
            discountType,
            sellerPricing
          )
        : discountValue ?? 0;

    const localized =
      v.localized && typeof v.localized === "object" && !Array.isArray(v.localized)
        ? (v.localized as VariantLocalizedMap)
        : {
            en: {
              title: v.title ?? "",
              option1: v.option1 ?? undefined,
              option2: v.option2 ?? undefined,
              option3: v.option3 ?? undefined,
            },
            ar: {
              title: "",
              option1: undefined,
              option2: undefined,
              option3: undefined,
            },
          };

    return {
      title: (localized.en.title || v.title) ?? "",
      sku: v.sku ?? "",
      listPrice: list,
      discountValue: isDefault ? discountValue ?? 0 : inferredDiscount,
      discountType,
      price: variantFinal,
      stock: isDefault
        ? quantity
        : typeof v.stock === "number"
          ? v.stock
          : 0,
      isDefault,
      localized,
      images: variantImages,
      imageUrl: variantImages[0] ?? v.imageUrl ?? undefined,
      option1: localized.en.option1 ?? v.option1 ?? undefined,
      option2: localized.en.option2 ?? v.option2 ?? undefined,
      option3: localized.en.option3 ?? v.option3 ?? undefined,
      barCode: v.barCode ?? undefined,
      position: v.position ?? undefined,
    };
  });

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
      unit: (dimensions.unit as "cm" | "in") ?? "cm",
      weightUnit: (dimensions.weightUnit as "kg" | "g" | "lb") ?? "kg",
    },
    images: images.length > 0 ? images : [],
    price: {
      base,
      list,
      discountValue,
      discountType,
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
    isTrending: product.isTrending ?? false,
    isSeasonal: product.isSeasonal ?? false,
    freeDelivery: product.freeDelivery ?? false,
    taxClass:
      (product.taxClass as AddProductFormData["taxClass"]) ?? "standard",
    notes: "",
    variantTypes,
    variants,
    localized: {
      en: product.localized?.en
        ? {
            title: product.localized.en.title ?? "",
            slug: product.localized.en.slug ?? "",
            description: product.localized.en.description ?? "",
            content: product.localized.en.content ?? "",
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
            content: product.localized.ar.content ?? "",
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
