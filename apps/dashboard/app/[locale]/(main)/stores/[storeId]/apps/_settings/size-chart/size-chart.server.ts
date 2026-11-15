"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreIntegrations, invalidateStoreSizeCharts } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { installStoreApp, uninstallStoreApp } from "@workspace/lib/billing/apps";
import { sizeChartPayloadSchema, sizeChartTargetsSchema } from "@workspace/lib/size-charts";
import {
  SIZE_CHART_APP,
  createStoreSizeChart,
  deleteStoreSizeChart,
  setSizeChartTargets,
  updateStoreSizeChart,
} from "@workspace/lib/size-charts/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { requireProductStore } from "@/lib/products/product-store.server";
import { appsAccessError, appsSaveLimiter } from "../../apps-action.lib";
import type { SizeChartActionResult } from "./size-chart.dto";

/**
 * Store › Apps › Size chart (ROADMAP.md F-92). Every action takes the store
 * explicitly and re-checks it with `requireStore` (rule 5); chart ids are
 * matched to that store on the server, and product / category ids are checked
 * to be the store's before they are saved. A change purges only that store's
 * size-chart tag, so its product pages pick it up at once.
 */

async function afterChange(sellerId: string, storeId: string, app = false) {
  await applyInvalidation(invalidateStoreSizeCharts(sellerId, storeId), { from: "dashboard", mode: "action" });
  if (app) await applyInvalidation(invalidateStoreIntegrations(sellerId, storeId), { from: "dashboard", mode: "action" });
  revalidatePath(`/stores/${storeId}/apps/size-chart`);
  revalidatePath(`/stores/${storeId}/apps/size-chart/settings`);
  if (app) revalidatePath(`/stores/${storeId}/apps`);
}

function failure(error: unknown, what: string, storeId: unknown): SizeChartActionResult<never> {
  const denied = appsAccessError(error);
  if (denied) return { success: false, error: denied.success ? "generic" : denied.error === "readOnly" ? "readOnly" : "notFound" };
  logServerError("integration", `size chart ${what} failed`, { storeId: String(storeId) }, error);
  return { success: false, error: "generic" };
}

/** Installs or removes the app. Removing keeps every chart; the storefront just stops showing them. */
export async function setSizeChartAppInstalled(storeId: string, installed: boolean): Promise<SizeChartActionResult<null>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`apps:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const target = { sellerId: seller.sellerId, storeId: store.id, appKey: SIZE_CHART_APP };
    if (installed) {
      const result = await installStoreApp({ ...target, actorId: seller.userId });
      if (!result.success && result.error !== "already_installed") return { success: false, error: "generic" };
    } else {
      const result = await uninstallStoreApp(target);
      if (!result.success) return { success: false, error: "notInstalled" };
    }
    await afterChange(seller.sellerId, store.id, true);
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "install", storeId);
  }
}

/** Creates a chart (`chartId` null) or saves one. The payload is checked with the shared schema. */
export async function saveSizeChart(storeId: string, chartId: string | null, payload: unknown): Promise<SizeChartActionResult<{ id: string }>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`size-chart:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const parsed = sizeChartPayloadSchema.safeParse(payload);
    if (!parsed.success) return { success: false, error: "invalid" };
    const scope = { sellerId: seller.sellerId, storeId: store.id };
    const result =
      chartId === null
        ? await createStoreSizeChart({ ...scope, actorId: seller.userId }, parsed.data)
        : await updateStoreSizeChart(scope, String(chartId), parsed.data).then((r) => (r.success ? { success: true as const, data: { id: String(chartId) } } : r));
    if (!result.success) return { success: false, error: result.error === "limit" ? "limit" : result.error === "invalid" ? "invalid" : "notFound" };
    await afterChange(seller.sellerId, store.id);
    return result;
  } catch (error) {
    return failure(error, "save", storeId);
  }
}

export async function deleteSizeChart(storeId: string, chartId: string): Promise<SizeChartActionResult<null>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!appsSaveLimiter.check(`size-chart:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const result = await deleteStoreSizeChart({ sellerId: seller.sellerId, storeId: store.id }, String(chartId));
    if (!result.success) return { success: false, error: "notFound" };
    await afterChange(seller.sellerId, store.id);
    return { success: true, data: null };
  } catch (error) {
    return failure(error, "delete", storeId);
  }
}

/** Replaces the products and store categories a chart is applied to. `moved` were on another chart. */
export async function saveSizeChartTargets(storeId: string, chartId: string, targets: unknown): Promise<SizeChartActionResult<{ moved: number }>> {
  try {
    const { seller, store, catalogSplit } = await requireProductStore(String(storeId));
    if (!appsSaveLimiter.check(`size-chart:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const parsed = sizeChartTargetsSchema.safeParse(targets);
    if (!parsed.success) return { success: false, error: "invalid" };
    const result = await setSizeChartTargets({ sellerId: seller.sellerId, storeId: store.id, catalogSplit }, String(chartId), parsed.data);
    if (!result.success) return { success: false, error: result.error === "invalid_targets" ? "invalidTargets" : "notFound" };
    await afterChange(seller.sellerId, store.id);
    return result;
  } catch (error) {
    return failure(error, "targets", storeId);
  }
}
