import { revalidatePath } from "next/cache";
import { dashboardRevalidateTargets, type RevalidateType } from "./revalidate-dashboard-path.lib";

/**
 * `revalidatePath` for a dashboard page, in every locale (Arabic is served at
 * `/ar/...` behind a rewrite, English at `/en/...`). Takes the path as the
 * seller sees it without a locale: a literal page (`/orders`,
 * `/stores/<id>/settings/checkout`) or, with `type`, a route pattern
 * (`/stores/[storeId]/products`, `"page"`). See `revalidate-dashboard-path.lib.ts`.
 *
 * `revalidatePath("/", "layout")` already covers every page and does not need it.
 */
export function revalidateDashboardPath(path: string, type?: RevalidateType): void {
  for (const target of dashboardRevalidateTargets(path, type)) revalidatePath(target.path, target.type);
}
