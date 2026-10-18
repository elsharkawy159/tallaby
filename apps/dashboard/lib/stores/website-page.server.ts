import { notFound } from "next/navigation";
import type { StoreRow } from "@workspace/lib/stores/server";
import { storeBuilderEnabled } from "@/components/dashboard/sidebar.config";
import { loadStorePage } from "./store-page.server";

/**
 * Loads the store for a /stores/[storeId]/website/… page: a foreign or
 * missing store is a 404 (loadStorePage), and so is a seller outside the
 * store-builder rollout (STORE_BUILDER_SELLER_IDS), like the editor.
 */
export async function loadWebsiteStorePage(storeId: string): Promise<StoreRow> {
  const store = await loadStorePage(storeId);
  if (!storeBuilderEnabled(store.sellerId)) notFound();
  return store;
}
