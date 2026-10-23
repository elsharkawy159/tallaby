/**
 * The builder's preview product (template product page spec §5.5): a
 * seller's product as the `ProductDetail` the product page elements draw.
 * Pure: `preview-product.server.ts` loads the rows, this maps them.
 *
 * Field meanings follow the storefront's `toProductDetail`
 * (apps/ecommerce/lib/store-site/product-detail.lib.ts): `quantity` is the
 * total stock (the variants' sum when there are variants), prices are the
 * rounded `final` / `list` of the price jsonb, and the rich content is
 * sanitised here with the storefront's sanitizer, since the renderer prints
 * `contentHtml` as is.
 */
import type { ProductDetail, ProductVariantDetail } from "@workspace/store-sections/render";
import { isRichTextEmpty, sanitizeRichTextHtml } from "@workspace/tiptap/sanitize";
import { getPriceList, parsePriceJson } from "../utils/parse-price-json";

export type PreviewLocale = "ar" | "en";

export type PreviewVariantRow = {
  id: string;
  title: string | null;
  price: unknown;
  stock: number | null;
  imageUrl: string | null;
  images: unknown;
  isDefault: boolean | null;
  localized: unknown;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  discountEndsAt: string | null;
};

export type PreviewProductRow = {
  id: string;
  status: string;
  images: unknown;
  price: unknown;
  quantity: string | number | null;
  averageRating: number | null;
  reviewCount: number | null;
  directCheckout: boolean;
  freeDelivery: boolean;
  productType: string | null;
  translation: { title: string; description: string | null; content: string | null; bulletPoints: unknown; slug: string | null } | null;
  brandName: string | null;
  category: { id: string; name: string | null; nameAr: string | null } | null;
  seller: { displayName: string; storeRating: number | null; totalRatings: number | null; freeDelivery: boolean };
  variants: PreviewVariantRow[];
};

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0) : [];

/** A product image path as a public URL (absolute URLs as they are). */
export function productImageUrl(path: string): string | null {
  if (!path.trim()) return null;
  if (/^https?:\/\//.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/products/${path}` : null;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

type VariantFields = { title?: string; option1?: string; option2?: string; option3?: string };

/** The variant's names in `locale` (its `localized` copy, else its own columns), as the storefront. */
function variantFields(variant: PreviewVariantRow, locale: PreviewLocale): VariantFields {
  const localized = isRecord(variant.localized) ? (variant.localized as Record<string, unknown>) : null;
  const own = isRecord(localized?.[locale]) ? localized![locale] : isRecord(localized?.en) ? localized!.en : null;
  if (own) return own as VariantFields;
  return { title: variant.title ?? "", option1: variant.option1 ?? undefined, option2: variant.option2 ?? undefined, option3: variant.option3 ?? undefined };
}

const COLOR_TYPE_NAMES = ["color", "colour", "اللون", "لون"];

/** The first color option's swatch (the seller's colour picker), as the storefront outlines a variant chip. */
function variantColor(variant: PreviewVariantRow, fields: VariantFields): string | null {
  const meta = isRecord(variant.localized) && Array.isArray(variant.localized.optionMeta) ? (variant.localized.optionMeta as unknown[]) : [];
  const options = [fields.option1, fields.option2, fields.option3];
  for (let i = 0; i < options.length; i += 1) {
    const option = options[i];
    if (!option) continue;
    const typeName = (option.match(/^(.+?):\s*(.+)$/)?.[1] ?? option).trim().toLowerCase();
    const entry = isRecord(meta[i]) ? (meta[i] as { kind?: unknown; swatch?: unknown }) : {};
    if (entry.kind !== "color" && !COLOR_TYPE_NAMES.includes(typeName)) continue;
    if (typeof entry.swatch === "string" && entry.swatch) return entry.swatch;
  }
  return null;
}

function variantImage(variant: PreviewVariantRow): string | null {
  const first = strings(variant.images)[0] ?? (variant.imageUrl || null);
  return first ? productImageUrl(first) : null;
}

/** The variant's price and list price, as `productPricing` does for a selected variant. */
function variantPricing(product: PreviewProductRow, variant: PreviewVariantRow) {
  const parsed = parsePriceJson(variant.price);
  const productList = getPriceList(product.price);
  const ownDiscount = parsed.list != null && parsed.list > parsed.final;
  const list = ownDiscount ? parsed.list : productList != null && productList > parsed.final ? productList : null;
  return { price: parsed.final, listPrice: list, stock: Number(variant.stock ?? 0) };
}

function variantDetail(product: PreviewProductRow, variant: PreviewVariantRow, locale: PreviewLocale): ProductVariantDetail {
  const fields = variantFields(variant, locale);
  const options = [fields.option1, fields.option2, fields.option3].filter(Boolean);
  const pricing = variantPricing(product, variant);
  return {
    id: variant.id,
    label: fields.title || variant.title || options.join(" ") || "",
    color: variantColor(variant, fields),
    image: variantImage(variant),
    price: pricing.price,
    compareAtPrice: pricing.listPrice,
    quantity: pricing.stock,
  };
}

/** The discount badge's percent (the seller's percent when set, else from the prices), as the storefront. */
function discountPercent(list: number | null, final: number, priceJson: unknown): number | null {
  if (list == null || list <= 0 || final >= list) return null;
  const parsed = parsePriceJson(priceJson);
  if (parsed.discountType === "percent" && parsed.discountValue != null && parsed.discountValue > 0) return Math.min(99, Math.round(parsed.discountValue));
  const percent = Math.round(((list - final) / list) * 100);
  return percent > 0 ? Math.min(99, percent) : null;
}

export function toPreviewProductDetail(product: PreviewProductRow, locale: PreviewLocale): ProductDetail {
  const parsed = parsePriceJson(product.price);
  const listPrice = parsed.list != null && parsed.list > parsed.final ? parsed.list : null;
  const discountEndsAt = isRecord(product.price) && typeof product.price.discountEndsAt === "string" ? product.price.discountEndsAt : null;
  const images = strings(typeof product.images === "string" ? [product.images] : product.images)
    .map(productImageUrl)
    .filter((url): url is string => Boolean(url));
  const variants = product.variants.map((variant) => variantDetail(product, variant, locale));
  // Total stock: what the variants hold when there are variants, else the product's own count.
  const own = Number(product.quantity ?? 0);
  const quantity = variants.length ? variants.reduce((sum, v) => sum + Math.max(0, v.quantity), 0) : Math.max(0, Number.isFinite(own) ? own : 0);
  const t = product.translation;
  const content = t?.content ?? "";
  const slug = t?.slug || product.id;
  const category = product.category
    ? { id: product.category.id, name: (locale === "ar" ? product.category.nameAr || product.category.name : product.category.name) ?? "" }
    : null;
  return {
    id: product.id,
    slug,
    title: t?.title ?? "",
    href: `/products/${slug}`,
    image: images[0] ?? null,
    price: parsed.final,
    compareAtPrice: listPrice,
    rating: product.averageRating != null ? Number(product.averageRating) : null,
    inStock: product.status === "active" && quantity > 0,
    description: t?.description?.trim() ? t.description : null,
    contentHtml: isRichTextEmpty(content) ? null : sanitizeRichTextHtml(content),
    bulletPoints: strings(t?.bulletPoints),
    images,
    discountPercent: discountPercent(listPrice, parsed.final, product.price),
    discountEndsAt: listPrice != null ? discountEndsAt : null,
    quantity,
    directCheckout: product.directCheckout === true,
    variants,
    reviewCount: Number(product.reviewCount ?? 0),
    brand: product.brandName,
    category,
    seller: {
      name: product.seller.displayName ?? "",
      rating: product.seller.storeRating != null ? Number(product.seller.storeRating) : null,
      ratingCount: Number(product.seller.totalRatings ?? 0),
      freeDelivery: product.productType !== "digital" && (product.freeDelivery === true || product.seller.freeDelivery === true),
    },
  };
}
