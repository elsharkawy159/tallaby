"use server";

import { getLocale } from "next-intl/server";
import { setProductPublished } from "@/actions/products";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { requireProductStore } from "@/lib/products/product-store.server";
import {
  listSellerProductIds,
  listSellerProductsForExport,
  loadOwnProductStatuses,
} from "./products-list.query";
import { parseProductsFilters, type ProductsListFilters } from "./products-view.lib";
import type { VendorProduct } from "./vendor-products.section";

/**
 * Actions on the whole filtered list, not just the page on screen (ROADMAP.md
 * F-43a). The seller comes from the session. Filters from the client are
 * parsed again here, and client ids only match the seller's own products.
 */

const MAX_BULK_PUBLISH = 3000;
const PUBLISH_BATCH = 20;

const parseListFilters = (filters: unknown) =>
  parseProductsFilters((filters ?? {}) as Partial<Record<keyof ProductsListFilters, string>>);

const failure = (error: unknown, label: string) => {
  if (!isAccessError(error)) console.error(`[products-list] ${label} failed`, error);
  return { success: false as const };
};

export async function exportFilteredProductsAction(
  filters: unknown,
): Promise<{ success: true; products: VendorProduct[] } | { success: false }> {
  try {
    const [seller, locale] = await Promise.all([requireSeller(), getLocale()]);
    return {
      success: true,
      products: await listSellerProductsForExport(seller.sellerId, parseListFilters(filters), locale),
    };
  } catch (error) {
    return failure(error, "export");
  }
}

export async function listFilteredProductIdsAction(
  filters: unknown,
): Promise<{ success: true; ids: string[] } | { success: false }> {
  try {
    const [seller, locale] = await Promise.all([requireSeller(), getLocale()]);
    return { success: true, ids: await listSellerProductIds(seller.sellerId, parseListFilters(filters), locale) };
  } catch (error) {
    return failure(error, "list ids");
  }
}

/**
 * Publishes or drafts the selected products, which can span pages the browser
 * never loaded. Rejected products and ones already in that state are skipped,
 * as the page always did; setProductPublished keeps its own checks per product.
 */
export async function bulkSetPublishedAction(
  storeId: unknown,
  ids: unknown,
  published: boolean,
): Promise<{ success: true; done: number; failed: number } | { success: false }> {
  try {
    // The store is the page's, checked against the session (F-87c); only its products are touched.
    const { seller, store, inStore } = await requireProductStore(storeId);
    const wanted = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string").slice(0, MAX_BULK_PUBLISH) : [];
    const own = await loadOwnProductStatuses(seller.sellerId, wanted, inStore);
    const targets = own.filter((p) => p.status !== "rejected" && (p.status === "active") !== published);

    let done = 0;
    let failed = 0;
    for (let i = 0; i < targets.length; i += PUBLISH_BATCH) {
      const results = await Promise.all(
        targets.slice(i, i + PUBLISH_BATCH).map((p) => setProductPublished(store.id, p.id, published)),
      );
      for (const r of results) {
        if (r.success) done++;
        else failed++;
      }
    }
    return { success: true, done, failed };
  } catch (error) {
    return failure(error, "bulk publish");
  }
}
