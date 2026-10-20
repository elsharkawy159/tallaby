"use server";

import { revalidatePath } from "next/cache";
import type { StorePayments } from "@workspace/lib/payments/store-methods";
import { updateStorePaymentMethod } from "@workspace/lib/stores/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { StorePaymentsErrorKey, StorePaymentsResult } from "./payments.dto";

/**
 * Store settings › Payment methods (PLAN.md §8.6, P3-07). storeId is explicit
 * and re-checked with requireStore; the change is validated, applied and
 * audited (masked) in @workspace/lib/stores/server. Never log the details.
 */

const saveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

const ERRORS: Record<string, StorePaymentsErrorKey> = {
  invalid_details: "invalidDetails",
  invalid_input: "invalidDetails",
  last_method: "lastMethod",
  not_available: "notAvailable",
  store_read_only: "readOnly",
  not_found: "notFound",
};

export async function saveStorePaymentMethod(
  storeId: string,
  method: string,
  change: { enabled: boolean; details?: unknown; fee?: number; maxOrder?: number | null; note?: string },
): Promise<StorePaymentsResult<StorePayments>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!saveLimiter.check(`payments:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const result = await updateStorePaymentMethod(seller.sellerId, seller.userId, store.id, String(method), {
      enabled: change?.enabled === true,
      ...(change?.details !== undefined && { details: change.details }),
      ...(typeof change?.fee === "number" && { fee: change.fee }),
      ...((typeof change?.maxOrder === "number" || change?.maxOrder === null) && { maxOrder: change.maxOrder }),
      ...(typeof change?.note === "string" && { note: change.note }),
    });
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    revalidatePath(`/stores/${store.id}/settings/payments`);
    return { success: true, data: result.data };
  } catch (error) {
    if (isAccessError(error)) {
      return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    }
    console.error("[store-payments] save failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
