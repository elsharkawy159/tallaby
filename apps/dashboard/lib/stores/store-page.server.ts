import { cache } from "react";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getStore, type StoreRow } from "@workspace/lib/stores/server";
import {
  isAccessError,
  requireStore,
  type StoreContext,
} from "@/lib/auth/require-seller.server";

/** A missing, deleted or foreign store is a 404; no session goes to login, no seller row to signup. */
async function onAccessError(error: unknown): Promise<never> {
  if (isAccessError(error)) {
    if (error.code === "unauthorized") redirect({ href: "/login", locale: await getLocale() });
    if (error.code === "no_seller") redirect({ href: "/signup", locale: await getLocale() });
    notFound();
  }
  throw error;
}

/**
 * Loads a store for a /stores/[storeId]/… page. A missing, deleted or foreign
 * store is a 404 (never "forbidden", so existence is not revealed). Once per
 * request: a layout and its page both call it.
 */
export const loadStorePage = cache(async (storeId: string): Promise<StoreRow> => {
  try {
    const { seller } = await requireStore(storeId);
    const store = await getStore(seller.sellerId, storeId);
    if (!store) notFound();
    return store;
  } catch (error) {
    return onAccessError(error);
  }
});

/**
 * `loadStorePage` for a page that needs only the checked store's id, name,
 * subdomain and status: the same checks and redirects, without reading the
 * whole `stores` row (requireStore already read these columns, per request).
 */
export const loadStorePageAccess = cache(async (storeId: string): Promise<StoreContext> => {
  try {
    const { store } = await requireStore(storeId);
    return store;
  } catch (error) {
    return onAccessError(error);
  }
});
