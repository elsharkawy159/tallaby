"use server";

import { getTranslations } from "next-intl/server";
import { readGoogleClientEnv, SHEET_COLUMNS } from "@workspace/lib/integrations";
import {
  createStoreSpreadsheet,
  exportStoreOrdersToSheet,
  type ExportSummary,
} from "@workspace/lib/integrations/server";
import { requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { afterAppChange, appsAccessError } from "./apps-action.lib";
import type { StoreAppsErrorKey, StoreAppsResult } from "./apps.dto";

/**
 * Store › Apps › Google Sheets (PLAN.md §9.2, P7-06): create the sheet and
 * export that store's orders on demand. Not reachable when the Google OAuth
 * env is unset (the page shows the app as "Soon").
 */

const limiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });

const ERRORS: Record<string, StoreAppsErrorKey> = {
  not_connected: "notConnected",
  store_read_only: "readOnly",
  auth: "googleFailed",
  failed: "googleFailed",
  no_sheet: "noSheet",
};

async function sheetHeaders(): Promise<string[]> {
  const t = await getTranslations("storeApps.googleSheets.columns");
  return SHEET_COLUMNS.map((column) => t(column));
}

export async function createGoogleSheet(storeId: string): Promise<StoreAppsResult<{ spreadsheetId: string }>> {
  try {
    const client = readGoogleClientEnv();
    if (!client) return { success: false, error: "notAvailable" };
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!limiter.check(`google:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const t = await getTranslations("storeApps.googleSheets");
    const result = await createStoreSpreadsheet(
      seller.sellerId,
      store.id,
      { title: t("sheetTitle", { store: store.name }), headers: await sheetHeaders() },
      client,
    );
    await afterAppChange(seller.sellerId, store.id);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    console.error("[store-apps] google sheet create failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}

export async function exportOrdersToGoogleSheet(storeId: string): Promise<StoreAppsResult<ExportSummary>> {
  try {
    const client = readGoogleClientEnv();
    if (!client) return { success: false, error: "notAvailable" };
    const { seller, store } = await requireStore(String(storeId));
    if (!limiter.check(`google:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await exportStoreOrdersToSheet(seller.sellerId, store.id, client);
    await afterAppChange(seller.sellerId, store.id);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    return { success: true, data: result.data };
  } catch (error) {
    const denied = appsAccessError(error);
    if (denied) return denied;
    console.error("[store-apps] google export failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}
