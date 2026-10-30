import { and, db, desc, eq, isNull, productTranslations, products, sql, storeProducts } from "@workspace/db";
import { parsePriceJson } from "@workspace/lib";
import { STORE_CATALOG_MAX_PRODUCTS } from "@workspace/lib/stores";
import type { CatalogProduct } from "./catalog.dto";

function publicImage(path: unknown): string | null {
  if (typeof path !== "string" || !path.trim()) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/products/${path}`;
}

/**
 * The seller's products for the catalog picker (PLAN.md D24, P4-07), any
 * status, this store's picks first, then newest. Never cached (seller data).
 */
export async function loadCatalogProducts(sellerId: string, storeId: string): Promise<CatalogProduct[]> {
  const picked = sql<boolean>`EXISTS (SELECT 1 FROM ${storeProducts} sp WHERE sp.store_id = ${storeId} AND sp.product_id = ${products.id})`;
  const rows = await db
    .select({
      id: products.id,
      status: products.status,
      images: products.images,
      price: products.price,
      sku: products.sku,
      titleAr: sql<string | null>`(SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} AND t.locale = 'ar' LIMIT 1)`,
      titleEn: sql<string | null>`(SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id} AND t.locale = 'en' LIMIT 1)`,
    })
    .from(products)
    .where(and(eq(products.sellerId, sellerId), isNull(products.deletedAt)))
    .orderBy(desc(picked), desc(products.createdAt))
    .limit(STORE_CATALOG_MAX_PRODUCTS);

  return rows.map((row) => ({
    id: row.id,
    status: row.status,
    title: { ar: row.titleAr ?? row.titleEn ?? row.sku ?? "", en: row.titleEn ?? row.titleAr ?? row.sku ?? "" },
    image: publicImage(Array.isArray(row.images) ? row.images[0] : null),
    price: parsePriceJson(row.price).final ?? null,
  }));
}
