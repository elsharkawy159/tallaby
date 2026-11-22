"use server";

import { and, asc, db, desc, eq, exists, ilike, isNull, or, products, productTranslations, sql, stores } from "@workspace/db";
import { productInStore } from "@workspace/lib/stores/scope/server";
import { getLocale } from "next-intl/server";
import { loadOrderLock, requireStore } from "@/lib/auth/require-seller.server";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";

export async function searchQrProducts(storeId: string, query: string) {
  const { seller, store } = await requireStore(storeId);
  if (seller.status !== "approved" || store.status !== "active") return [];
  const [liveStore] = await db.select({ defaultLocale: stores.defaultLocale }).from(stores).where(and(
    eq(stores.id, store.id),
    eq(stores.sellerId, seller.sellerId),
    eq(stores.siteStatus, "published"),
    isNull(stores.deletedAt),
  ));
  if (!liveStore || (await loadOrderLock(seller.sellerId)).storeOffline) return [];

  const [catalogSplit, locale] = await Promise.all([isSwitchOn("stores_catalog_split"), getLocale()]);
  const storefrontLocale = liveStore.defaultLocale === "en" ? "en" : "ar";
  const text = typeof query === "string" ? query.trim().slice(0, 100) : "";
  const pattern = `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const chosen = db.select({
    slug: productTranslations.slug,
    locale: productTranslations.locale,
  }).from(productTranslations).where(and(
    eq(productTranslations.productId, products.id),
    sql`${productTranslations.locale} IN ('ar', 'en')`,
    sql`nullif(${productTranslations.slug}, '') IS NOT NULL`,
  )).orderBy(desc(sql`${productTranslations.locale} = ${storefrontLocale}`)).limit(1).as("qr_slug");

  const rows = await db.select({
    id: products.id,
    slug: chosen.slug,
    title: sql<string | null>`(
      SELECT t.title FROM ${productTranslations} t WHERE t.product_id = ${products.id}
      ORDER BY (t.locale = ${locale}) DESC, t.locale LIMIT 1
    )`,
  }).from(products).innerJoinLateral(chosen, sql`true`).where(and(
    eq(products.sellerId, seller.sellerId),
    eq(products.status, "active"),
    isNull(products.deletedAt),
    productInStore(store.id, { catalogSplit, scope: "shown" }),
    // A legacy duplicate slug can resolve to an older product or to a
    // default-language translation of another product. Hide ambiguous links.
    sql`NOT EXISTS (
      SELECT 1 FROM ${productTranslations} t
      JOIN ${products} p ON p.id = t.product_id
      WHERE p.seller_id = ${seller.sellerId} AND p.id <> ${products.id}
        AND p.status = 'active' AND t.slug = ${chosen.slug}
        ${catalogSplit ? sql`AND p.store_id = ${store.id}` : sql``}
        AND (
          t.locale = ${storefrontLocale} AND ${chosen.locale} <> ${storefrontLocale}
          OR t.locale = ${chosen.locale} AND (
            p.created_at < ${products.createdAt}
            OR p.created_at IS NOT DISTINCT FROM ${products.createdAt} AND p.id < ${products.id}
            OR p.created_at IS NOT NULL AND ${products.createdAt} IS NULL
          )
        )
    )`,
    text ? or(ilike(products.sku, pattern), ilike(chosen.slug, pattern), exists(
      db.select({ one: sql`1` }).from(productTranslations).where(and(
        eq(productTranslations.productId, products.id),
        ilike(productTranslations.title, pattern),
      )),
    )) : undefined,
  )).orderBy(desc(products.createdAt), asc(products.id)).limit(40);

  return rows.flatMap(({ id, slug, title }) => slug ? [{ id, slug, label: title || slug }] : []);
}
