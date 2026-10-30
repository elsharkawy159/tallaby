"use server";

import { revalidatePath } from "next/cache";
import { exportWassalhaOrders } from "@workspace/lib/shipping/wassalha-export";
import type { EgyptPostRow } from "@workspace/lib/shipping";
import type { WassalhaSkipReason } from "@workspace/lib/shipping/wassalha-export";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Orders › "Export for Wassalha" (ROADMAP.md F-12c). storeId is explicit and
 * re-checked; only that store's orders are read. The rows come back to the
 * browser, which writes the .xlsx (same helper as the orders export).
 */

const exportLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });

export type WassalhaExportActionResult =
  | {
      success: true;
      data: { header: string[]; rows: EgyptPostRow[]; exported: number; skipped: { orderNumber: string; reason: WassalhaSkipReason }[] };
    }
  | { success: false; error: "notSetUp" | "noOrders" | "tooMany" | "rateLimited" | "readOnly" | "notFound" | "generic" };

const ERRORS = { not_set_up: "notSetUp", no_orders: "noOrders", too_many: "tooMany" } as const;

export async function exportForWassalha(storeId: string, orderIds: string[]): Promise<WassalhaExportActionResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!exportLimiter.check(`wassalha-export:${store.id}`)) return { success: false, error: "rateLimited" };

    const ids = Array.isArray(orderIds) ? orderIds.filter((id): id is string => typeof id === "string") : [];
    const result = await exportWassalhaOrders(seller.sellerId, store.id, ids);
    if (!result.success) return { success: false, error: ERRORS[result.error] };

    revalidatePath("/orders");
    return {
      success: true,
      data: {
        header: [...result.data.header],
        rows: result.data.rows,
        exported: result.data.exportedOrderIds.length,
        skipped: result.data.skipped.map(({ orderNumber, reason }) => ({ orderNumber, reason })),
      },
    };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    console.error("[wassalha-export] failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}
