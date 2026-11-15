import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
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
      if (error.code === "unauthorized") redirect({ href: "/login", locale: await getLocale() });
      if (error.code === "no_seller") redirect({ href: "/signup", locale: await getLocale() });
      notFound();
    }
    throw error;
  }
}
