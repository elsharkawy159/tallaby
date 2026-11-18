"use server";

import { revalidatePath } from "next/cache";
import { logServerError } from "@workspace/db/log";
import { sendTallabyPayKycRejectedEmail, sendTallabyPayPayoutEmail } from "@workspace/lib/orders";
import {
  TALLABY_PAY_ADMIN_ERROR_MESSAGES,
  TALLABY_PAY_DECLINE_ERROR_MESSAGES,
  TALLABY_PAY_REFUND_ERROR_MESSAGES,
  TALLABY_PAY_SETTINGS_ERROR_MESSAGES,
  TALLABY_PAY_WALLET_ADMIN_ERROR_MESSAGES,
  adjustTallabyPayWallet,
  declineTallabyPayRefund,
  freezeTallabyPayWallet,
  markTallabyPayDuplicateRefunded,
  markTallabyPayPayoutPaid,
  refundTallabyPaySale,
  rejectTallabyPayKyc,
  rejectTallabyPayPayout,
  reverseTallabyPayPayout,
  unfreezeTallabyPayWallet,
  updateTallabyPaySettings,
  verifyTallabyPayKyc,
  type TallabyPayAdminError,
  type TallabyPayDeclineError,
  type TallabyPayRefundError,
  type TallabyPaySettingsAdminError,
  type TallabyPayWalletAdminError,
} from "@workspace/lib/tallaby-pay/server";
import { adminActorId, type AdminActionResult } from "../_lib/saas-admin.server";

/**
 * Admin › Tallaby Pay actions (ROADMAP.md F-100e; design §7). Money decisions
 * need the same permission as store top-ups and affiliate payouts
 * (canManageUsers). The lib re-checks the admin in the database, refuses an
 * admin's own account, guards every status change and writes admin_audit_log.
 * The pages and the wallet, paid-twice and settings actions are F-100g.
 * Seller emails go after the commit and are best-effort (the backend claims
 * one per outcome); the bells come from 0176's triggers.
 */

const fail = (code: TallabyPayAdminError | "generic"): AdminActionResult => ({
  success: false,
  error: TALLABY_PAY_ADMIN_ERROR_MESSAGES[code] ?? TALLABY_PAY_ADMIN_ERROR_MESSAGES.generic,
});

type LibResult = { success: true } | { success: false; error: TallabyPayAdminError };

async function act(
  label: string,
  call: (adminId: string) => Promise<LibResult>,
  message: string,
  after?: () => Promise<unknown>,
): Promise<AdminActionResult> {
  const adminId = await adminActorId("canManageUsers");
  if (!adminId) return fail("not_admin");
  try {
    const result = await call(adminId);
    if (!result.success) return fail(result.error);
    revalidatePath("/tallaby-pay", "layout");
    if (after) await after().catch((error) => logServerError("admin", `tallaby pay ${label} email failed`, {}, error));
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
    () => sendTallabyPayPayoutEmail(String(input.payoutId)),
  );
}

export async function rejectTallabyPayPayoutAction(input: { payoutId: string; reason: string }) {
  return act(
    "reject payout",
    (adminId) => rejectTallabyPayPayout({ payoutId: String(input?.payoutId), adminId, reason: String(input?.reason ?? "") }),
    "Request rejected",
    () => sendTallabyPayPayoutEmail(String(input.payoutId)),
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
    () => sendTallabyPayKycRejectedEmail(String(input.sellerId)),
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

// ---------------------------------------------------------------------------
// F-100g: wallets, paid twice, settings
// ---------------------------------------------------------------------------

const walletFail = (code: TallabyPayWalletAdminError | "generic"): AdminActionResult => ({
  success: false,
  error: TALLABY_PAY_WALLET_ADMIN_ERROR_MESSAGES[code] ?? TALLABY_PAY_WALLET_ADMIN_ERROR_MESSAGES.generic,
});

async function walletAct(
  label: string,
  call: (adminId: string) => Promise<{ success: true } | { success: false; error: TallabyPayWalletAdminError }>,
  message: string,
): Promise<AdminActionResult> {
  const adminId = await adminActorId("canManageUsers");
  if (!adminId) return walletFail("not_admin");
  try {
    const result = await call(adminId);
    if (!result.success) return walletFail(result.error);
    revalidatePath("/tallaby-pay", "layout");
    return { success: true, message };
  } catch (error) {
    logServerError("admin", `tallaby pay ${label} failed`, {}, error);
    return walletFail("generic");
  }
}

/** Freezes a store's earnings: no withdrawal request or Mark paid until unfrozen. Sales and refunds still post. */
export async function freezeTallabyPayWalletAction(input: { walletId: string; reason: string }) {
  return walletAct("freeze wallet", (adminId) => freezeTallabyPayWallet({ adminId, input }), "Earnings frozen");
}

export async function unfreezeTallabyPayWalletAction(input: { walletId: string; reason: string }) {
  return walletAct("unfreeze wallet", (adminId) => unfreezeTallabyPayWallet({ adminId, input }), "Earnings unfrozen");
}

/** Adds to or takes from a store's available earnings (for example a chargeback fee). */
export async function adjustTallabyPayWalletAction(input: {
  walletId: string;
  key: string;
  direction: "credit" | "debit";
  amount: string;
  reason: string;
}) {
  return walletAct("adjust wallet", (adminId) => adjustTallabyPayWallet({ adminId, input }), "Adjustment posted");
}

/** The team refunded a second payment ("paid twice") in Tallaby's EasyKash account. */
export async function markTallabyPayDuplicateRefundedAction(input: { paymentId: string; reason: string; reference?: string }) {
  return walletAct(
    "duplicate refund",
    (adminId) =>
      markTallabyPayDuplicateRefunded({
        adminId,
        paymentId: String(input?.paymentId),
        reason: String(input?.reason ?? ""),
        reference: input?.reference == null ? null : String(input.reference),
      }),
    "Refund recorded",
  );
}

/** Fee, hold days, minimum withdrawal and the launch switch. Same permission as Admin › Billing. */
export async function updateTallabyPaySettingsAction(input: unknown): Promise<AdminActionResult> {
  const adminId = await adminActorId("canManageSettings");
  const settingsFail = (code: TallabyPaySettingsAdminError | "generic"): AdminActionResult => ({
    success: false,
    error: TALLABY_PAY_SETTINGS_ERROR_MESSAGES[code] ?? TALLABY_PAY_SETTINGS_ERROR_MESSAGES.generic,
  });
  if (!adminId) return settingsFail("not_admin");
  try {
    const result = await updateTallabyPaySettings({ adminId, input });
    if (!result.success) return settingsFail(result.error);
    revalidatePath("/tallaby-pay", "layout");
    return { success: true, message: "Saved and logged. New orders use these settings." };
  } catch (error) {
    logServerError("admin", "tallaby pay settings update failed", {}, error);
    return settingsFail("generic");
  }
}

/**
 * Declines a seller's refund request (design §8): the money stays the
 * seller's and releases on delivery (now, if the order was already
 * delivered). Refused for a payment made after the cancel.
 */
export async function declineTallabyPayRefundAction(input: { saleId: string; reason: string }): Promise<AdminActionResult> {
  const adminId = await adminActorId("canManageUsers");
  const declineFail = (code: TallabyPayDeclineError | "generic"): AdminActionResult => ({
    success: false,
    error: TALLABY_PAY_DECLINE_ERROR_MESSAGES[code] ?? TALLABY_PAY_DECLINE_ERROR_MESSAGES.generic,
  });
  if (!adminId) return declineFail("not_admin");
  try {
    const result = await declineTallabyPayRefund({ saleId: String(input?.saleId), adminId, reason: String(input?.reason ?? "") });
    if (!result.success) return declineFail(result.error);
    revalidatePath("/tallaby-pay", "layout");
    return {
      success: true,
      message: result.data.released ? "Request declined. The order was delivered, so the money is now available." : "Request declined",
    };
  } catch (error) {
    logServerError("admin", "tallaby pay decline refund failed", {}, error);
    return declineFail("generic");
  }
}
