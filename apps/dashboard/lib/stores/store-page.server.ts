import { notFound, redirect } from "next/navigation";
import { getStore, type StoreRow } from "@workspace/lib/stores/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";

/**
 * Loads a store for a /stores/[storeId]/… page. A missing, deleted or foreign
 * store is a 404 (never "forbidden", so existence is not revealed).
 */
export async function loadStorePage(storeId: string): Promise<StoreRow> {
  try {
    const { seller } = await requireStore(storeId);
    const store = await getStore(seller.sellerId, storeId);
    if (!store) notFound();
    return store;
  } catch (error) {
    if (isAccessError(error)) {
      if (error.code === "unauthorized") redirect("/login");
      if (error.code === "no_seller") redirect("/signup");
      notFound();
    }
    throw error;
  }
}
