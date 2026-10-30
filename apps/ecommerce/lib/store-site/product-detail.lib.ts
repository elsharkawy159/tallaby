import type { ProductDetail, ProductVariantDetail } from "@workspace/store-sections/render";
import { isRichTextEmpty, sanitizeRichTextHtml } from "@workspace/tiptap/sanitize";
import { plainTextToRichText } from "@workspace/tiptap/plain-text";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { pricingDiscountPercent, productHasFreeDelivery, productPricing } from "@/components/product-page/product-page.lib";
import type { Product } from "@/components/product-page/product-page.types";
import type { ProductLocale } from "@/lib/product-translations";
import { getVariantColor } from "@/lib/variant-colors";
import { getVariantImageUrls } from "@/lib/variant-images";
import { getVariantDisplayFields } from "@/lib/variant-localized";

/**
 * The store product page's product (`ctx.product`, template product page
 * spec §5.2), from the storefront's `Product`. Built on the server: the
 * rich content is sanitised here, as today's `ProductContent` does, since
 * the renderer prints `contentHtml` as is.
 */

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0) : [];

const productImage = (path: string) => getPublicUrl(path, "products") || null;

function variantDetail(product: Product, variant: NonNullable<Product["productVariants"]>[number], locale: ProductLocale): ProductVariantDetail {
  const display = getVariantDisplayFields(variant, locale);
  const options = [display.option1, display.option2, display.option3].filter(Boolean);
  const pricing = productPricing(product, variant);
  const image = getVariantImageUrls(variant)[0];
  return {
    id: variant.id,
    label: display.title || variant.title || options.join(" ") || "",
    color: getVariantColor(variant, locale)?.hex ?? null,
    image: image ? productImage(image) : null,
    price: pricing.price,
    compareAtPrice: pricing.listPrice,
    quantity: pricing.stock,
  };
}

type StoreCategoryRef = { key: string; name: string | null; nameAr: string | null };

/**
 * The store category (`StorefrontCategory`, its catalog filter
 * `/products?category=<key>`) the product sits in, by the rule of
 * `storeCategoryGroups`: its seller category; unlinked, the seller category
 * picked from its Tallaby category, else the Tallaby root group holding it.
 * Without that list, a root category is its own key (slug, else id, no
 * name); a sub-category then has none, since its root is not known here.
 */
export function storeCategoryOf(
  product: Pick<Product, "sellerCategoryId"> & { category: Pick<NonNullable<Product["category"]>, "id" | "slug" | "parentId"> | null | undefined },
  storeCategories: readonly (StoreCategoryRef & { sellerCategoryId: string | null; sourceCategoryId: string | null; categoryIds: readonly string[] })[],
): StoreCategoryRef | null {
  const { sellerCategoryId, category } = product;
  const own = sellerCategoryId
    ? storeCategories.find((c) => c.sellerCategoryId === sellerCategoryId)
    : category &&
      (storeCategories.find((c) => c.sellerCategoryId && c.sourceCategoryId === category.id) ??
        storeCategories.find((c) => !c.sellerCategoryId && c.categoryIds.includes(category.id)));
  if (own) return { key: own.key, name: own.name, nameAr: own.nameAr };
  if (!category || category.parentId) return null;
  return { key: category.slug || category.id, name: null, nameAr: null };
}

export function toProductDetail(
  product: Product,
  locale: ProductLocale,
  /** `storeCategory`: its store category (`storeCategoryOf`), for the breadcrumb name and link. */
  { storeCategory }: { storeCategory?: StoreCategoryRef | null } = {},
): ProductDetail {
  const pricing = productPricing(product, null);
  // As the gallery (ProductHero): a list of paths, or a single path.
  const images = strings(typeof product.images === "string" ? [product.images] : product.images).map(productImage).filter((url): url is string => Boolean(url));
  const variants = (product.productVariants ?? []).map((variant) => variantDetail(product, variant, locale));
  // Total stock: what the variants hold when there are variants, else the product's own count.
  const quantity = variants.length ? variants.reduce((sum, v) => sum + Math.max(0, v.quantity), 0) : Math.max(0, pricing.stock);
  const content = product.content ?? "";
  // The store category's own name when it has one, else the Tallaby category's.
  const named = storeCategory?.name || storeCategory?.nameAr ? storeCategory : product.category;
  const category = product.category
    ? {
        id: product.category.id,
        name: (named ? (locale === "ar" ? named.nameAr || named.name : named.name || named.nameAr) : null) ?? "",
        // The storefront catalog filtered to it, as the store's category lists link (catalog.server.ts).
        ...(storeCategory && { href: `/products?category=${encodeURIComponent(storeCategory.key)}` }),
      }
    : null;

  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    href: `/products/${product.slug}`,
    image: images[0] ?? null,
    price: pricing.price,
    compareAtPrice: pricing.listPrice,
    rating: product.averageRating != null ? Number(product.averageRating) : null,
    inStock: product.status === "active" && quantity > 0,
    trending: product.isTrending === true,
    seasonal: product.isSeasonal === true,
    // Plain text and sanitised HTML, as mergeProductWithTranslation builds them.
    description: product.description?.trim() ? product.description : null,
    descriptionHtml: product.description?.trim()
      ? (product.descriptionHtml ?? sanitizeRichTextHtml(plainTextToRichText(product.description)))
      : null,
    contentHtml: isRichTextEmpty(content) ? null : sanitizeRichTextHtml(content),
    bulletPoints: strings(product.bulletPoints),
    images,
    discountPercent: pricingDiscountPercent(product, null, pricing),
    discountEndsAt: pricing.listPrice != null ? pricing.discountEndsAt : null,
    quantity,
    directCheckout: product.directCheckout === true,
    liveViews: product.showLiveViews === true,
    variants,
    reviewCount: Number(product.reviewCount ?? 0),
    brand: product.brand?.name ?? null,
    category,
    seller: {
      name: product.seller?.displayName ?? "",
      rating: product.seller?.storeRating != null ? Number(product.seller.storeRating) : null,
      ratingCount: Number(product.seller?.totalRatings ?? 0),
      freeDelivery: productHasFreeDelivery(product),
    },
  };
}
