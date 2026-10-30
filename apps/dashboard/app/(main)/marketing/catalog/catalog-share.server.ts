"use server";

import { and, asc, db, desc, eq, inArray, isNull, sql } from "@workspace/db";
import { products, stores } from "@workspace/db/schema";
import { CATALOG_SHARE_MAX_PRODUCTS, catalogShareUrls, normalizeCatalogTitle, signCatalogShare } from "@workspace/lib/catalog-share";
import { catalogShareKey } from "@workspace/lib/catalog-share/server";
import { storeCategoryGroups } from "@workspace/lib/store-sites/catalog-data";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { getLocale } from "next-intl/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import {
  catalogLinkInputSchema,
  type CatalogLinkResult,
  type CatalogShareCategory,
  type CatalogShareStore,
} from "./catalog-share.dto";

/**
 * Shareable catalog links (ROADMAP.md F-11c). The seller comes from the
 * session; every store and product is checked against it. A link is a signed
 * token (`@workspace/lib/catalog-share`), nothing is stored: no migration.
 */

const ownActiveStore = (sellerId: string, storeId: string) =>
  and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt), eq(stores.status, "active"));

/** The seller's active stores, primary first. */
export async function listCatalogShareStoresAction(): Promise<CatalogShareStore[]> {
  try {
    const { sellerId } = await requireSeller();
    const rows = await db
      .select({ id: stores.id, name: stores.name, siteStatus: stores.siteStatus, catalogMode: stores.catalogMode })
      .from(stores)
      .where(and(eq(stores.sellerId, sellerId), isNull(stores.deletedAt), eq(stores.status, "active")))
      .orderBy(desc(stores.isPrimary), asc(stores.createdAt));
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      published: row.siteStatus === "published",
      selectedCatalog: row.catalogMode === "selected",
    }));
  } catch (error) {
    if (!isAccessError(error)) console.error("[catalog-share] stores failed:", (error as Error)?.message);
    return [];
  }
}

/** The store's categories as its website groups them (same keys as the store's catalog filter). */
export async function listCatalogShareCategoriesAction(storeId: string): Promise<CatalogShareCategory[]> {
  try {
    const { sellerId } = await requireSeller();
    const [store] = await db
      .select({ id: stores.id, catalogMode: stores.catalogMode })
      .from(stores)
      .where(ownActiveStore(sellerId, storeId))
      .limit(1);
    if (!store) return [];
    const locale = await getLocale();
    const groups = await storeCategoryGroups(sellerId, store.catalogMode === "selected" ? store.id : undefined);
    return groups.map((group) => ({
      key: group.key,
      name: (locale === "ar" ? group.nameAr || group.name : group.name || group.nameAr) ?? group.key,
      productCount: group.productCount,
    }));
  } catch (error) {
    if (!isAccessError(error)) console.error("[catalog-share] categories failed:", (error as Error)?.message);
    return [];
  }
}

/** Signs a catalog link for one of the seller's stores. */
export async function createCatalogLinkAction(input: unknown): Promise<CatalogLinkResult> {
  const parsed = catalogLinkInputSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid" };
  try {
    const { sellerId } = await requireSeller();
    const { storeId, source } = parsed.data;
    const [store] = await db
      .select({
        id: stores.id,
        subdomain: stores.subdomain,
        siteStatus: stores.siteStatus,
        catalogMode: stores.catalogMode,
        supportedLocales: stores.supportedLocales,
      })
      .from(stores)
      .where(ownActiveStore(sellerId, storeId))
      .limit(1);
    if (!store) return { success: false, error: "store" };

    let count = 0;
    let skipped = 0;
    let signedSource = source;
    if (source.kind === "products") {
      // Only the seller's active, non-trashed products this store shows; the
      // store page checks again on every view.
      const requested = [...new Set(source.productIds.map((id) => id.toLowerCase()))];
      const rows = await db
        .select({ id: products.id })
        .from(products)
        .where(
          and(
            inArray(products.id, requested),
            eq(products.sellerId, sellerId),
            eq(products.status, "active"),
            isNull(products.deletedAt),
            store.catalogMode === "selected"
              ? sql`EXISTS (SELECT 1 FROM store_products sp WHERE sp.store_id = ${store.id} AND sp.product_id = ${products.id})`
              : undefined,
          ),
        );
      const ok = new Set(rows.map((row) => row.id.toLowerCase()));
      const kept = requested.filter((id) => ok.has(id)).slice(0, CATALOG_SHARE_MAX_PRODUCTS);
      if (!kept.length) return { success: false, error: "noProducts" };
      count = kept.length;
      skipped = requested.length - kept.length;
      signedSource = { kind: "products", productIds: kept };
    } else if (source.kind === "category") {
      const groups = await storeCategoryGroups(sellerId, store.catalogMode === "selected" ? store.id : undefined);
      const group = groups.find((g) => g.key === source.categoryKey);
      if (!group) return { success: false, error: "noProducts" };
      count = Math.min(group.productCount, CATALOG_SHARE_MAX_PRODUCTS);
    }

    let key: Buffer;
    try {
      key = catalogShareKey();
    } catch {
      return { success: false, error: "config" };
    }
    const token = signCatalogShare({ storeId: store.id, title: normalizeCatalogTitle(parsed.data.title), source: signedSource }, sellerId, key);
    const customDomain = await findActiveCustomDomainForSubdomain(store.subdomain);
    const urls = catalogShareUrls(storeUrl(store.subdomain, customDomain), token, store.supportedLocales);
    return {
      success: true,
      ...urls,
      count,
      skipped,
      max: CATALOG_SHARE_MAX_PRODUCTS,
      published: store.siteStatus === "published",
    };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "store" };
    console.error("[catalog-share] create failed:", (error as Error)?.message);
    return { success: false, error: "failed" };
  }
}
