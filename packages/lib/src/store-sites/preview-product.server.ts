/**
 * The product the builder's product page canvas shows (template product page
 * spec §5.5). Store-scoped and never cached (rule 8: builder data): the
 * store must be the session seller's (rule 5), and the product must be one
 * this store shows, as the storefront decides (`storeShowsProduct`): an
 * active product of the seller, and in selected catalog mode (D24) one of
 * the store's picks.
 */
import { and, asc, brands, categories, db, desc, eq, isNull, productTranslations, productVariants, products, sellers, sql, storeProducts, stores } from "@workspace/db";
import type { ProductDetail } from "@workspace/store-sections/render";
import { toPreviewProductDetail, type PreviewLocale } from "./preview-product.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `productId` picks the product; without it, the newest active product the
 * store shows. Null for a foreign or missing store, a product the store does
 * not show, or a store with no product (the editor then draws DEMO_PRODUCT).
 */
export async function getStorePreviewProduct(
  sellerId: string,
  storeId: string,
  productId?: string,
  opts: { locale?: PreviewLocale; q?: Queryable } = {},
): Promise<ProductDetail | null> {
  const q = opts.q ?? db;
  const locale = opts.locale ?? "ar";
  if (!UUID_RE.test(sellerId) || !UUID_RE.test(storeId)) return null;
  if (productId !== undefined && !UUID_RE.test(productId)) return null;

  const [store] = await q
    .select({ catalogMode: stores.catalogMode })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .limit(1);
  if (!store) return null;

  const [row] = await q
    .select({
      id: products.id,
      status: products.status,
      images: products.images,
      price: products.price,
      quantity: products.quantity,
      averageRating: products.averageRating,
      reviewCount: products.reviewCount,
      directCheckout: products.directCheckout,
      freeDelivery: products.freeDelivery,
      productType: products.productType,
      brandName: brands.name,
      categoryId: categories.id,
      categoryName: categories.name,
      categoryNameAr: categories.nameAr,
      sellerName: sellers.displayName,
      sellerRating: sellers.storeRating,
      sellerRatings: sellers.totalRatings,
      sellerFreeDelivery: sellers.freeDelivery,
    })
    .from(products)
    .innerJoin(sellers, eq(sellers.id, products.sellerId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(
      and(
        eq(products.sellerId, sellerId),
        eq(products.status, "active"),
        productId ? eq(products.id, productId) : undefined,
        store.catalogMode === "selected"
          ? sql`EXISTS (SELECT 1 FROM ${storeProducts} sp WHERE sp.store_id = ${storeId} AND sp.product_id = ${products.id})`
          : undefined,
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(1);
  if (!row) return null;

  const [translations, variants] = await Promise.all([
    q
      .select({
        locale: productTranslations.locale,
        title: productTranslations.title,
        description: productTranslations.description,
        content: productTranslations.content,
        bulletPoints: productTranslations.bulletPoints,
        slug: productTranslations.slug,
      })
      .from(productTranslations)
      .where(eq(productTranslations.productId, row.id)),
    q
      .select({
        id: productVariants.id,
        title: productVariants.title,
        price: productVariants.price,
        stock: productVariants.stock,
        imageUrl: productVariants.imageUrl,
        images: productVariants.images,
        isDefault: productVariants.isDefault,
        localized: productVariants.localized,
        option1: productVariants.option1,
        option2: productVariants.option2,
        option3: productVariants.option3,
        discountEndsAt: productVariants.discountEndsAt,
      })
      .from(productVariants)
      .where(eq(productVariants.productId, row.id))
      .orderBy(asc(productVariants.position), asc(productVariants.createdAt)),
  ]);
  // The preview language's copy, else the other one.
  const translation = translations.find((t) => t.locale === locale) ?? translations[0] ?? null;

  return toPreviewProductDetail(
    {
      id: row.id,
      status: row.status,
      images: row.images,
      price: row.price,
      quantity: row.quantity,
      averageRating: row.averageRating,
      reviewCount: row.reviewCount,
      directCheckout: row.directCheckout,
      freeDelivery: row.freeDelivery,
      productType: row.productType,
      translation,
      brandName: row.brandName,
      category: row.categoryId ? { id: row.categoryId, name: row.categoryName, nameAr: row.categoryNameAr } : null,
      seller: { displayName: row.sellerName, storeRating: row.sellerRating, totalRatings: row.sellerRatings, freeDelivery: row.sellerFreeDelivery },
      variants,
    },
    locale,
  );
}
