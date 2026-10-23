/**
 * The product a template's product page preview draws: its own demo
 * catalog's first product (so a fashion template shows a fashion piece), not
 * the generic headphones. Preview only; a real store uses its own product.
 * No React here.
 */
import { DEMO_PRODUCT } from "../core/demo-product";
import type { ProductDetail } from "../core/types";
import type { SiteLocale } from "../config/schema";
import type { TemplateDemo } from "./types";

const DESCRIPTION: Record<SiteLocale, string> = {
  ar: "منتج من مجموعتنا، مصنوع بعناية وجاهز للشحن.",
  en: "A piece from our collection, made with care and ready to ship.",
};

/** Extra gallery shots taken from other demo products. */
const EXTRA_IMAGES = 2;

export function templateDemoProduct(demo: TemplateDemo, opts: { storeName?: string; locale?: SiteLocale } = {}): ProductDetail {
  const locale = opts.locale ?? "ar";
  const storeName = opts.storeName ?? (demo.store.name[locale] || demo.store.name.ar || DEMO_PRODUCT.seller.name);
  const first = demo.products.find((p) => p.image) ?? demo.products[0];
  if (!first) return { ...DEMO_PRODUCT, seller: { ...DEMO_PRODUCT.seller, name: storeName } };

  const own = first.image ? [first.image] : [];
  const others = demo.products
    .filter((p) => p.id !== first.id && p.image && p.image !== first.image)
    .map((p) => p.image as string);
  const images = [...own, ...Array.from(new Set(others)).slice(0, EXTRA_IMAGES)];

  const { price, compareAtPrice } = first;
  const onSale = price != null && compareAtPrice != null && compareAtPrice > price;
  const category = demo.categories.find((c) => c.id === first.categoryId);

  return {
    id: first.id,
    slug: first.slug,
    title: first.title[locale] || first.title.ar,
    href: "/product",
    image: first.image,
    images,
    price,
    compareAtPrice: onSale ? compareAtPrice : null,
    discountPercent: onSale ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : null,
    discountEndsAt: null,
    rating: first.rating,
    reviewCount: first.rating != null ? 12 : 0,
    inStock: first.inStock,
    quantity: first.inStock ? 24 : 0,
    directCheckout: false,
    description: DESCRIPTION[locale],
    contentHtml: null,
    bulletPoints: [],
    variants: [],
    brand: null,
    category: category ? { id: category.id, name: category.name[locale] || category.name.ar } : null,
    seller: { name: storeName, rating: null, ratingCount: 0, freeDelivery: false },
  };
}
