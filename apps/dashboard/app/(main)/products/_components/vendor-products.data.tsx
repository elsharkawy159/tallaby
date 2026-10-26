import { getLocale } from "next-intl/server";
import { getSellerProducts } from "@/actions/products";
import { parsePriceJson } from "@workspace/lib";
import { richTextToPlainText } from "@workspace/tiptap/plain-text";
import { loadProductStoreLinks } from "./product-store-links.data";
import { VendorProductsSection, type VendorProduct } from "./vendor-products.section";

export async function VendorProductsData() {
  const [{ data, totalCount }, locale] = await Promise.all([
    getSellerProducts({ offset: 0 }),
    getLocale(),
  ]);
  const isArabic = locale.startsWith("ar");

  const products: Omit<VendorProduct, "storeUrl">[] = (data || []).map((p) => {
    const translations = p.productTranslations ?? [];
    const enTranslation = translations.find((t) => t.locale === "en");
    const arTranslation = translations.find((t) => t.locale === "ar");
    // Name, description and category follow the dashboard language, falling
    // back to the other language when the product has only one.
    const [preferred, fallback] = isArabic
      ? [arTranslation, enTranslation]
      : [enTranslation, arTranslation];
    const slug = (enTranslation?.slug ?? arTranslation?.slug ?? "").trim() || null;
    // Carried for the Excel export, not rendered as a column.
    const description =
      richTextToPlainText(preferred?.description ?? fallback?.description) || null;
    // `products.price` is a jsonb column, so it comes back as `unknown`;
    // parsePriceJson normalises it the way the storefront shows it.
    const price = parsePriceJson(p.price);

    return {
      id: p.id,
      title: preferred?.title || fallback?.title || p.title,
      slug: slug || null,
      sku: p.sku,
      description,
      images: Array.isArray(p.images) ? (p.images as string[]) : [],
      status: p.status ?? "pending",
      condition: p.condition ?? null,
      isFeatured: p.isFeatured ?? false,
      quantity:
        typeof p.quantity === "string"
          ? parseInt(p.quantity, 10)
          : (p.quantity ?? 0),
      basePrice: price.base,
      salePrice: price.final,
      brand: p.brand ? { name: p.brand.name } : null,
      category: p.category
        ? {
            name:
              (isArabic
                ? p.category.nameAr || p.category.name
                : p.category.name || p.category.nameAr) ?? null,
          }
        : null,
      averageRating: p.averageRating ?? null,
      reviewCount: p.reviewCount ?? 0,
    };
  });

  const storeLinks = await loadProductStoreLinks(products.map((p) => ({ id: p.id, slug: p.slug ?? null })));
  const rows: VendorProduct[] = products.map((p) => ({ ...p, storeUrl: storeLinks.get(p.id) ?? null }));

  return <VendorProductsSection products={rows} total={totalCount || 0} />;
}
