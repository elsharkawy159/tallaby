"use server";

import { revalidatePath } from "next/cache";
import { logServerError } from "@workspace/db/log";
import {
  TALLABY_PAY_ADMIN_ERROR_MESSAGES,
  TALLABY_PAY_REFUND_ERROR_MESSAGES,
  markTallabyPayPayoutPaid,
  refundTallabyPaySale,
  rejectTallabyPayKyc,
  rejectTallabyPayPayout,
  reverseTallabyPayPayout,
  verifyTallabyPayKyc,
  type TallabyPayAdminError,
  type TallabyPayRefundError,
} from "@workspace/lib/tallaby-pay/server";
import { adminActorId, type AdminActionResult } from "../_lib/saas-admin.server";

/**
 * Admin › Tallaby Pay actions (ROADMAP.md F-100e; design §7). Money decisions
 * need the same permission as store top-ups and affiliate payouts
 * (canManageUsers). The lib re-checks the admin in the database, refuses an
 * admin's own account, guards every status change and writes admin_audit_log.
 * The pages are F-100g.
 */

const fail = (code: TallabyPayAdminError | "generic"): AdminActionResult => ({
  success: false,
  error: TALLABY_PAY_ADMIN_ERROR_MESSAGES[code] ?? TALLABY_PAY_ADMIN_ERROR_MESSAGES.generic,
});

type LibResult = { success: true } | { success: false; error: TallabyPayAdminError };

async function act(label: string, call: (adminId: string) => Promise<LibResult>, message: string): Promise<AdminActionResult> {
  const adminId = await adminActorId("canManageUsers");
  if (!adminId) return fail("not_admin");
  try {
    const result = await call(adminId);
    if (!result.success) return fail(result.error);
    revalidatePath("/tallaby-pay", "layout");
    return { success: true, message };
  } catch (error) {
    logServerError("admin", `tallaby pay ${label} failed`, {}, error);
    return fail("generic");
  }
}

export async function markTallabyPayPayoutPaidAction(input: { payoutId: string; reference: string }) {
  return act(
    "mark paid",
    (adminId) => markTallabyPayPayoutPaid({ payoutId: String(input?.payoutId), adminId, reference: String(input?.reference ?? "") }),
    "Marked as paid",
  );
}

export async function rejectTallabyPayPayoutAction(input: { payoutId: string; reason: string }) {
  return act(
    "reject payout",
    (adminId) => rejectTallabyPayPayout({ payoutId: String(input?.payoutId), adminId, reason: String(input?.reason ?? "") }),
    "Request rejected",
  );
}

export async function reverseTallabyPayPayoutAction(input: { payoutId: string; reason: string }) {
  return act(
    "reverse payout",
    (adminId) => reverseTallabyPayPayout({ payoutId: String(input?.payoutId), adminId, reason: String(input?.reason ?? "") }),
    "Withdrawal reversed",
  );
}

export async function verifyTallabyPayKycAction(input: { sellerId: string }) {
  return act("verify kyc", (adminId) => verifyTallabyPayKyc({ sellerId: String(input?.sellerId), adminId }), "Identity verified");
}

export async function rejectTallabyPayKycAction(input: { sellerId: string; reason: string }) {
  return act(
    "reject kyc",
    (adminId) => rejectTallabyPayKyc({ sellerId: String(input?.sellerId), adminId, reason: String(input?.reason ?? "") }),
    "Identity rejected",
  );
}

/**
 * Records a refund the team made in Tallaby's EasyKash account for a sale
 * whose order was never delivered (ROADMAP.md F-100d; owner 2026-11-18): the
 * sale's net leaves pending and its fee leaves the Fees box. After delivery
 * the lib refuses it (the seller refunds the customer himself).
 */
export async function refundTallabyPaySaleAction(input: { saleId: string; reason: string; reference?: string }) {
  const adminId = await adminActorId("canManageUsers");
  const refundFail = (code: TallabyPayRefundError | "generic"): AdminActionResult => ({
    success: false,
    error: TALLABY_PAY_REFUND_ERROR_MESSAGES[code] ?? TALLABY_PAY_REFUND_ERROR_MESSAGES.generic,
  });
  if (!adminId) return refundFail("not_admin");
  try {
    const result = await refundTallabyPaySale({
      saleId: String(input?.saleId),
      adminId,
      reason: String(input?.reason ?? ""),
      reference: input?.reference == null ? null : String(input.reference),
    });
    if (!result.success) return refundFail(result.error);
    revalidatePath("/tallaby-pay", "layout");
    return { success: true, message: "Refund recorded" } satisfies AdminActionResult;
  } catch (error) {
    logServerError("admin", "tallaby pay refund failed", {}, error);
    return refundFail("generic");
  }
}
