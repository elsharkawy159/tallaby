"use server";

import { getLocale } from "next-intl/server";
import { setProductPublished } from "@/actions/products";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { requireProductStore } from "@/lib/products/product-store.server";
import { digitalProductsMissingFiles } from "../_digital/digital-publish.server";
import {
  listSellerProductIds,
  listSellerProductsForExport,
  loadOwnProductStatuses,
} from "./products-list.query";
import { parseProductsFilters, type ProductsListFilters } from "./products-view.lib";
import type { VendorProduct } from "./vendor-products.section";
import type { LiveSite } from "@/app/[locale]/(main)/_components/publish-celebration.client";

/**
 * Actions on the whole filtered list, not just the page on screen (ROADMAP.md
 * F-43a). The store is the page's, checked against the session (F-87c). Filters from the client are
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
  storeId: unknown,
  filters: unknown,
): Promise<{ success: true; products: VendorProduct[] } | { success: false }> {
  try {
    // The page's store, checked against the session (F-87c slice 2): only its products are exported.
    const [{ seller, inStore }, locale] = await Promise.all([requireProductStore(storeId, { read: true }), getLocale()]);
    return {
      success: true,
      products: await listSellerProductsForExport(seller.sellerId, inStore, parseListFilters(filters), locale),
    };
  } catch (error) {
    return failure(error, "export");
  }
}

export async function listFilteredProductIdsAction(
  storeId: unknown,
  filters: unknown,
): Promise<{ success: true; ids: string[] } | { success: false }> {
  try {
    const [{ seller, inStore }, locale] = await Promise.all([requireProductStore(storeId, { read: true }), getLocale()]);
    return { success: true, ids: await listSellerProductIds(seller.sellerId, inStore, parseListFilters(filters), locale) };
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
): Promise<{ success: true; done: number; failed: number; live?: LiveSite } | { success: false }> {
  try {
    // The store is the page's, checked against the session (F-87c); only its products are touched.
    const { seller, store, inStore } = await requireProductStore(storeId);
    const wanted = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string").slice(0, MAX_BULK_PUBLISH) : [];
    const own = await loadOwnProductStatuses(seller.sellerId, wanted, inStore);
    const candidates = own.filter((p) => p.status !== "rejected" && (p.status === "active") !== published);
    // Digital products with no file stay drafts (F-108b): one batched check, counted as failed.
    const missingFile = published ? await digitalProductsMissingFiles(seller.sellerId, candidates.map((p) => p.id)) : new Set<string>();
    const targets = missingFile.size ? candidates.filter((p) => !missingFile.has(p.id)) : candidates;

    let done = 0;
    let failed = missingFile.size;
    let live: LiveSite | null = null;
    for (let i = 0; i < targets.length; i += PUBLISH_BATCH) {
      const results = await Promise.all(
        targets.slice(i, i + PUBLISH_BATCH).map((p) => setProductPublished(store.id, p.id, published)),
      );
      for (const r of results) {
        if (r.success) done++;
        else failed++;
        // The store went live with one of them (once ever): the page shows the go-live dialog.
        if ("live" in r && r.live) live = r.live;
      }
    }
    return { success: true, done, failed, ...(live && { live }) };
  } catch (error) {
    return failure(error, "bulk publish");
  }
}
