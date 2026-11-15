import { routing } from "@/i18n/routing";

/**
 * What `revalidateDashboardPath` hands to Next's `revalidatePath`
 * (docs/plans/dashboard-static-shell.md Phase 1.3). Pure, so it is unit-tested.
 *
 * Every dashboard page lives under `app/[locale]/`, and Arabic URLs are a
 * proxy rewrite to `/ar/...`. `revalidatePath` matches the route file
 * structure, not the browser URL (Next docs, "Using revalidatePath with
 * rewrites"), so an unprefixed `/orders` no longer reaches any page:
 *
 * - A literal page path (no `type`) becomes one literal path per locale
 *   (`/ar/orders`, `/en/orders`): the cache tag of a rendered page is its
 *   resolved pathname, so the concrete ids in the path still count.
 * - A `type` call (`"page"` or `"layout"`) is matched against tags built from
 *   the route file path, which includes `[locale]` and the route group
 *   (`/[locale]/(main)/orders/layout`). So it becomes the `/[locale]/(group)`
 *   pattern, once per group: it covers both locales in one call. The path must
 *   be a route pattern (`/stores/[storeId]/settings`), never a concrete id: a
 *   concrete id appears in no route-file tag and would match nothing.
 */

/** The route groups under `app/[locale]` (a test checks this against the folder). */
export const DASHBOARD_ROUTE_GROUPS = ["(main)", "(builder)"] as const;

export type RevalidateType = "page" | "layout";

export interface RevalidateTarget {
  path: string;
  type?: RevalidateType;
}

/** `path` without a trailing slash; "" for the root. Must start with "/". */
function normalise(path: string): string {
  if (!path.startsWith("/")) throw new Error(`revalidateDashboardPath: "${path}" must start with "/"`);
  return path.replace(/\/+$/, "");
}

export function dashboardRevalidateTargets(path: string, type?: RevalidateType): RevalidateTarget[] {
  const rest = normalise(path);
  if (!type) return routing.locales.map((locale) => ({ path: `/${locale}${rest}` }));
  return DASHBOARD_ROUTE_GROUPS.map((group) => ({ path: `/[locale]/${group}${rest}`, type }));
}
