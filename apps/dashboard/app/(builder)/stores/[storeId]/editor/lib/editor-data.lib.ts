/**
 * Editor store data (P4B-05): where each empty state's button goes, and how
 * a load result maps to the canvas data state. Pure; the hook and the canvas
 * use it, tests cover it.
 *
 * Routes are this dashboard's own management pages (checked to exist when
 * written); every one is scoped to the session seller by its page, and the
 * store-scoped ones carry the store id from the editor URL.
 */
import type { DataNeed } from "@workspace/store-sections/render";
import type { EditorStoreData } from "../server/editor.data";

export type DataAction = { kind: "link"; href: string } | { kind: "pages" };

/** The fix for "no records" of a need. Navigation is managed in the editor itself (Pages panel). */
export function dataAction(need: DataNeed, store: { id: string; catalogMode: string | null | undefined }): DataAction {
  const id = encodeURIComponent(store.id);
  switch (need) {
    case "products":
      // A store showing selected products needs its picks, not new products.
      return { kind: "link", href: store.catalogMode === "selected" ? `/stores/${id}/settings#catalog-mode` : "/products/add" };
    case "categories":
      return { kind: "link", href: "/products/categories" };
    case "brands":
      return { kind: "link", href: "/products/brands" };
    case "reviews":
      return { kind: "link", href: "/reviews" };
    case "promotions":
      return { kind: "link", href: "/coupons" };
    case "articles":
      return { kind: "link", href: `/stores/${id}/website/blog/new` };
    case "storeInfo":
      return { kind: "link", href: `/stores/${id}/settings` };
    case "forms":
      return { kind: "link", href: `/stores/${id}/website/forms` };
    case "navigation":
      return { kind: "pages" };
  }
}

const FAILED_NEED: Record<EditorStoreData["failed"][number], DataNeed> = {
  sales: "products",
  brands: "brands",
  reviews: "reviews",
  coupons: "promotions",
};

/** Needs whose source failed to load, for `editorData.failed`. */
export function failedNeeds(failed: readonly EditorStoreData["failed"][number][]): DataNeed[] {
  return [...new Set(failed.map((key) => FAILED_NEED[key]))];
}

/** Same-tab-group channel the dashboard posts on after creating or changing store data. */
export const STORE_DATA_CHANNEL = "tallaby:store-data";

/** Minimum time between automatic refreshes (focus, tab visible), in ms. */
export const REFRESH_INTERVAL_MS = 5_000;

/** Whether an automatic refresh may run now. Forced refreshes (Retry, a change message) always may. */
export function shouldRefresh(lastAt: number, now: number, inFlight: boolean, force = false): boolean {
  if (inFlight) return false;
  return force || now - lastAt >= REFRESH_INTERVAL_MS;
}
