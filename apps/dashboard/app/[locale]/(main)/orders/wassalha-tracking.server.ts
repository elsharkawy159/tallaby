"use server";

import { revalidatePath } from "next/cache";
import {
  cleanTrackingEntries,
  WASSALHA_TRACKING_MAX_ROWS,
  type RawTrackingEntry,
  type TrackingProblem,
} from "@workspace/lib/shipping/wassalha-tracking";
import { applyWassalhaTracking, type TrackingApplyReason } from "@workspace/lib/shipping/wassalha-tracking/server";
import { isAccessError, requireOrdersStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Orders › Wassalha tracking numbers (ROADMAP.md F-12e). storeId is explicit and
 * re-checked; the rows come from the browser, so they are cleaned again here, and
 * only this store's orders can match.
 */

const limiter = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });

export type WassalhaTrackingProblem = {
  row: number;
  orderNumber: string;
  trackingNumber: string;
  reason: TrackingProblem["reason"] | TrackingApplyReason;
};

export type WassalhaTrackingActionResult =
  | { success: true; data: { saved: number; unchanged: number; problems: WassalhaTrackingProblem[] } }
  | { success: false; error: "tooMany" | "rateLimited" | "readOnly" | "notFound" | "locked" | "generic" };

function failure(error: unknown): WassalhaTrackingActionResult {
  if (isAccessError(error)) {
    if (error.code === "orders_locked") return { success: false, error: "locked" };
    return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
  }
  console.error("[wassalha-tracking] failed", (error as Error)?.name);
  return { success: false, error: "generic" };
}

async function save(storeId: string, raw: RawTrackingEntry[], replace: boolean): Promise<WassalhaTrackingActionResult> {
  try {
    const { seller, store } = await requireOrdersStore(String(storeId), { forWrite: true });
    if (!limiter.check(`wassalha-tracking:${store.id}`)) return { success: false, error: "rateLimited" };
    if (raw.length > WASSALHA_TRACKING_MAX_ROWS) return { success: false, error: "tooMany" };

    const { entries, problems } = cleanTrackingEntries(raw);
    const applied = await applyWassalhaTracking(seller.sellerId, store.id, entries, { replace });
    if (applied.saved > 0) revalidatePath("/orders");
    return {
      success: true,
      data: {
        saved: applied.saved,
        unchanged: applied.unchanged,
        problems: [...problems, ...applied.problems].sort((a, b) => a.row - b.row),
      },
    };
  } catch (error) {
    return failure(error);
  }
}

/** The rows of a result file. Never replaces a different number already saved. */
export async function uploadWassalhaTracking(storeId: string, rows: RawTrackingEntry[]): Promise<WassalhaTrackingActionResult> {
  return save(storeId, Array.isArray(rows) ? rows : [], false);
}

/** One number the seller typed on an order, which may correct the saved one. */
export async function saveWassalhaTrackingNumber(
  storeId: string,
  orderNumber: string,
  trackingNumber: string,
): Promise<WassalhaTrackingActionResult> {
  return save(storeId, [{ row: 0, orderNumber: String(orderNumber), trackingNumber: String(trackingNumber) }], true);
}
