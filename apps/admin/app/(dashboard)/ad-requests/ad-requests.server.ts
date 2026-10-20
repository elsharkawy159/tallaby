"use server";

import { revalidatePath } from "next/cache";
import { logServerError } from "@workspace/db/log";
import { retryAdRefundByAdmin, setAdRequestStatusByAdmin } from "@workspace/lib/admin/server";
import { adminActorId, saasError, type AdminActionResult } from "../_lib/saas-admin.server";

const STATUS_MESSAGES: Record<string, string> = {
  approved: "Request approved",
  active: "Campaign marked live",
  completed: "Campaign completed",
  rejected: "Request rejected",
};

function refreshAds(sellerId?: string) {
  revalidatePath("/ad-requests");
  revalidatePath("/");
  if (sellerId) revalidatePath(`/sellers/${sellerId}`);
}

/** Move one ad request along its status flow (docs/admin-saas.md §3.8). Audited. */
export async function adStatusAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageProducts");
  if (!actorId) return saasError("not_admin");
  try {
    const result = await setAdRequestStatusByAdmin(actorId, input);
    if (!result.success) return saasError(result.error);
    refreshAds(result.data.sellerId);
    const base = `${STATUS_MESSAGES[result.data.status] ?? "Saved"} and logged`;
    if (result.data.refund === "failed") {
      return { success: false, error: `${base}, but the wallet refund failed. Use "Retry refund".` };
    }
    if (result.data.refund === "refunded") return { success: true, message: `${base}. The store wallet was refunded.` };
    return { success: true, message: base };
  } catch (error) {
    logServerError("wallet", "admin ad status change failed", {}, error);
    return saasError("generic");
  }
}

/** Re-run the idempotent wallet refund of a rejected wallet-paid request. */
export async function retryAdRefundAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageProducts");
  if (!actorId) return saasError("not_admin");
  const requestId = (input as { requestId?: unknown } | null)?.requestId;
  if (typeof requestId !== "string") return saasError("invalid_input");
  try {
    const outcome = await retryAdRefundByAdmin(actorId, requestId);
    refreshAds();
    if (outcome === "refunded") return { success: true, message: "Store wallet refunded" };
    if (outcome === "already_refunded") return { success: true, message: "Already refunded" };
    return saasError("no_change");
  } catch (error) {
    logServerError("wallet", "admin ad refund retry failed", { requestId }, error);
    return saasError("refund_failed");
  }
}
