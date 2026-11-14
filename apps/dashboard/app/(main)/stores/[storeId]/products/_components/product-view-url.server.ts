"use server";

import { and, db, eq, products } from "@workspace/db";
import { requireStoreProduct } from "@/lib/products/product-store.server";
import { productViewUrl } from "@/lib/products/product-view-url.lib";
import { loadProductViewTarget } from "./product-store-links.data";

/**
 * The saved product's page on its live store, for the "View" action on the
 * product-saved toast. Read from the database after the save, so the status
 * and the slug are the ones the server kept (a taken slug gets a suffix).
 * The store is checked against the session and the product must be in it;
 * null when a visitor couldn't open the page (draft, store offline) or on any
 * error, since the toast simply shows without the action.
 */
export async function getProductViewUrl(storeId: string, productId: string): Promise<string | null> {
  try {
    const { seller, store } = await requireStoreProduct(storeId, productId, { read: true });
    const [row, target] = await Promise.all([
      db.query.products.findFirst({
        where: and(eq(products.id, productId), eq(products.sellerId, seller.sellerId)),
        columns: { status: true },
        with: { productTranslations: { columns: { locale: true, slug: true } } },
      }),
      loadProductViewTarget(seller.sellerId, store.id),
    ]);
    if (!row) return null;
    // One slug per product, the English one, saved in both languages.
    const slug =
      row.productTranslations.find((t) => t.locale === "en")?.slug ?? row.productTranslations[0]?.slug ?? null;
    return productViewUrl({ status: row.status, slug, target });
  } catch (error) {
    console.error("getProductViewUrl failed:", error);
    return null;
  }
}
