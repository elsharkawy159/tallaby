import { getSellerProducts } from "@/actions/products";
import { VendorProductsSection, type VendorProduct } from "./vendor-products.section";

/** `products.price` is a jsonb column, so it comes back as `unknown`. */
type ProductPrice = { base?: number; final?: number } | null;

export async function VendorProductsData() {
  const { data, totalCount } = await getSellerProducts({
    offset: 0,
  });

  const rows: VendorProduct[] = (data || []).map((p) => {
    const translations = p.productTranslations ?? [];
    const enTranslation = translations.find((t) => t.locale === "en");
    const arTranslation = translations.find((t) => t.locale === "ar");
    const slug = (enTranslation?.slug ?? arTranslation?.slug ?? "").trim() || null;
    // Carried for the Excel export, not rendered as a column.
    const description =
      enTranslation?.description ?? arTranslation?.description ?? null;
    const price = (p.price ?? null) as ProductPrice;

    return {
      id: p.id,
      title: p.title,
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
      basePrice: price?.base ?? null,
      salePrice: price?.final ?? null,
      brand: p.brand ? { name: p.brand.name } : null,
      category: p.category
        ? { name: p.category.name ?? p.category.nameAr ?? null }
        : null,
      averageRating: p.averageRating ?? null,
      reviewCount: p.reviewCount ?? 0,
    };
  });

  return <VendorProductsSection products={rows} total={totalCount || 0} />;
}
