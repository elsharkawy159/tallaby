import { and, categories, db, desc, eq, inArray, productTranslations, products, sql, storeProducts } from "@workspace/db";
import { parsePriceJson } from "@workspace/lib";

/**
 * Read-only data the editor canvas needs to preview commerce sections
 * (PLAN.md P4-06, P4-07): the active products this store can show (the
 * seller's, or the store's picks in selected catalog mode) and their categories. Loaded once per editor session; the canvas filters it locally.
 * Never cached (seller-specific editor data).
 */

export type EditorProduct = {
  id: string;
  title: { ar: string; en: string };
  slug: string;
  image: string | null;
  price: number | null;
  compareAtPrice: number | null;
  isFeatured: boolean;
  categoryId: string;
  inStock: boolean;
  createdAt: string;
};

export type EditorCategory = { id: string; name: { ar: string; en: string }; image: string | null; productCount: number };

const MAX_PRODUCTS = 300;

function publicImage(path: unknown): string | null {
  if (typeof path !== "string" || !path.trim()) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${path}`;
}

/** `catalogStoreId` is set for a store in selected catalog mode (D24): only its picks are listed. */
export async function loadEditorCatalog(
  sellerId: string,
  catalogStoreId?: string,
): Promise<{ products: EditorProduct[]; categories: EditorCategory[] }> {
  const rows = await db
    .select({
      id: products.id,
      images: products.images,
      price: products.price,
      isFeatured: products.isFeatured,
      categoryId: products.categoryId,
      quantity: products.quantity,
      createdAt: products.createdAt,
      titleAr: sql<string | null>`(SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} AND t.locale = 'ar' LIMIT 1)`,
      titleEn: sql<string | null>`(SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} AND t.locale = 'en' LIMIT 1)`,
      slug: sql<string | null>`(SELECT coalesce(t.slug, '') FROM ${productTranslations} t WHERE t.product_id = ${products.id} ORDER BY (t.locale = 'ar') DESC LIMIT 1)`,
    })
    .from(products)
    .where(
      and(
        eq(products.sellerId, sellerId),
        eq(products.status, "active"),
        catalogStoreId
          ? sql`EXISTS (SELECT 1 FROM ${storeProducts} sp WHERE sp.store_id = ${catalogStoreId} AND sp.product_id = ${products.id})`
          : undefined,
      ),
    )
    .orderBy(desc(products.createdAt))
    .limit(MAX_PRODUCTS);

  const list: EditorProduct[] = rows.map((row) => {
    const price = parsePriceJson(row.price);
    const final = price.final ?? null;
    const list = price.list ?? null;
    const title = { ar: row.titleAr ?? row.titleEn ?? "", en: row.titleEn ?? row.titleAr ?? "" };
    return {
      id: row.id,
      title,
      slug: row.slug || row.id,
      image: publicImage(Array.isArray(row.images) ? row.images[0] : null),
      price: final,
      compareAtPrice: list != null && final != null && list > final ? list : null,
      isFeatured: Boolean(row.isFeatured),
      categoryId: row.categoryId,
      inStock: Number(row.quantity ?? 0) > 0,
      createdAt: row.createdAt ?? "",
    };
  });

  const categoryIds = [...new Set(list.map((p) => p.categoryId))];
  const categoryRows = categoryIds.length
    ? await db
        .select({ id: categories.id, name: categories.name, nameAr: categories.nameAr, imageUrl: categories.imageUrl })
        .from(categories)
        .where(inArray(categories.id, categoryIds))
    : [];

  return {
    products: list,
    categories: categoryRows
      .map((c) => ({
        id: c.id,
        name: { ar: c.nameAr ?? c.name ?? "", en: c.name ?? c.nameAr ?? "" },
        image: publicImage(c.imageUrl) ?? list.find((p) => p.categoryId === c.id && p.image)?.image ?? null,
        productCount: list.filter((p) => p.categoryId === c.id).length,
      }))
      .sort((a, b) => b.productCount - a.productCount),
  };
}
