"use server";

import { revalidatePath } from "next/cache";
import { logServerError } from "@workspace/db/log";
import {
  REFERRAL_ADMIN_ERROR_MESSAGES,
  markReferralPayoutPaid,
  rejectReferralPayout,
  relockReferrer,
  reverseReferralCommissions,
  type ReferralAdminError,
} from "@workspace/lib/admin/server";
import { adminActorId, type AdminActionResult } from "../_lib/saas-admin.server";

/**
 * Admin › Referrals actions (F-37, 0117). Money decisions need the same
 * permission as store top-ups (canManageUsers). Each is audited in the lib.
 */

const fail = (code: ReferralAdminError | "generic"): AdminActionResult => ({
  success: false,
  error: REFERRAL_ADMIN_ERROR_MESSAGES[code] ?? REFERRAL_ADMIN_ERROR_MESSAGES.generic,
});

type LibResult = { success: true } | { success: false; error: ReferralAdminError };

async function act(label: string, call: (actorId: string) => Promise<LibResult>, message: string): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return fail("not_admin");
  try {
    const result = await call(actorId);
    if (!result.success) return fail(result.error);
    revalidatePath("/referrals", "layout");
    return { success: true, message };
  } catch (error) {
    logServerError("admin", `referrals ${label} failed`, {}, error);
    return fail("generic");
  }
}

export async function markReferralPayoutPaidAction(input: { payoutId: string; reference: string }) {
  return act("mark paid", (actorId) => markReferralPayoutPaid(actorId, input), "Marked as paid");
}

export async function rejectReferralPayoutAction(input: { payoutId: string; reason: string }) {
  return act("reject payout", (actorId) => rejectReferralPayout(actorId, input), "Request rejected");
}

export async function reverseReferralCommissionsAction(input: { referredSellerId: string; reason: string }) {
  return act("reverse", (actorId) => reverseReferralCommissions(actorId, input), "Commissions reversed");
}

export async function relockReferrerAction(input: { sellerId: string; reason: string }) {
  return act("relock", (actorId) => relockReferrer(actorId, input), "Withdrawals locked again");
}
