"use server";

import { revalidatePath } from "next/cache";
import {
  applyInvalidation,
  invalidateCustomDomain,
  invalidateSeller,
  invalidateStoreIntegrations,
  invalidateStoreSite,
  mergeInvalidations,
} from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import {
  adjustStoreWalletByAdmin,
  applyAdminStoreAction,
  applySellerOverride,
  sendSellerMessageByAdmin,
} from "@workspace/lib/admin/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";
import { adminErrorMessage } from "./seller-admin.lib";

/**
 * Admin overrides on the seller page (PLAN.md P9-01, P9-02). Each action:
 * the admin session guard (`canManageUsers`), then a @workspace/lib function
 * that re-checks the admin in the database, validates the input (required
 * reason), applies the change and writes admin_audit_log in one transaction.
 */

type ActionResult = { success: true; message: string } | { success: false; error: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function adminActor(): Promise<string | null> {
  try {
    return (await validateAdminAccess("canManageUsers")).id;
  } catch {
    return null;
  }
}

/** The seller id the lib already validated (only used for revalidation). */
function sellerIdOf(input: unknown): string | null {
  const id = (input as { sellerId?: unknown } | null)?.sellerId;
  return typeof id === "string" && UUID_RE.test(id) ? id : null;
}

function refreshSellerPages(sellerId: string | null) {
  revalidatePath("/sellers");
  if (sellerId) revalidatePath(`/sellers/${sellerId}`);
  // The store-wallet screens show the same balance, limit and audit rows.
  revalidatePath("/wallets", "layout");
}

/** Plan, store-limit exception, fee plan, trial, exemption, negative limit. */
export async function sellerOverrideAction(input: unknown): Promise<ActionResult> {
  const actorId = await adminActor();
  if (!actorId) return { success: false, error: adminErrorMessage("not_admin") };
  const sellerId = sellerIdOf(input);

  try {
    const result = await applySellerOverride(actorId, input);
    if (!result.success) return { success: false, error: adminErrorMessage(result.error) };

    if (sellerId && (input as { action?: string }).action === "set_commission_exempt") {
      await applyInvalidation(invalidateSeller(sellerId), { from: "admin", mode: "action" });
    }
    refreshSellerPages(sellerId);
    return { success: true, message: "Saved and logged" };
  } catch (error) {
    logServerError("admin", "seller override failed", { sellerId }, error);
    return { success: false, error: adminErrorMessage("generic") };
  }
}

/** Force-unpublish, suspend or unsuspend a single store. */
export async function storeAdminAction(input: unknown): Promise<ActionResult> {
  const actorId = await adminActor();
  if (!actorId) return { success: false, error: adminErrorMessage("not_admin") };
  const sellerId = sellerIdOf(input);

  try {
    const result = await applyAdminStoreAction(actorId, input);
    if (!result.success) return { success: false, error: adminErrorMessage(result.error) };

    // Same tags the dashboard clears on publish/unpublish, plus the custom
    // domain lookup and tracking (a suspended store stops resolving). Only
    // this store's tags: sibling stores keep their cache.
    const { sellerId: owner, storeId, subdomain, customDomain } = result.data;
    await applyInvalidation(
      mergeInvalidations(
        invalidateStoreSite(owner, storeId, subdomain),
        invalidateStoreIntegrations(owner, storeId),
        ...(customDomain ? [invalidateCustomDomain(subdomain, customDomain)] : []),
      ),
      { from: "admin", mode: "action" },
    );
    refreshSellerPages(owner);
    return { success: true, message: "Store updated and logged" };
  } catch (error) {
    const storeId = (input as { storeId?: unknown } | null)?.storeId;
    logServerError(
      "publish",
      "admin store action failed",
      { sellerId, storeId: typeof storeId === "string" ? storeId : null, action: String((input as { action?: unknown })?.action ?? "") },
      error,
    );
    return { success: false, error: adminErrorMessage("generic") };
  }
}

/** Store-wallet `adjustment` through postStoreWalletEntry (idempotent per form key). */
export async function walletAdjustmentAction(input: unknown): Promise<ActionResult> {
  const actorId = await adminActor();
  if (!actorId) return { success: false, error: adminErrorMessage("not_admin") };
  const sellerId = sellerIdOf(input);

  try {
    const result = await adjustStoreWalletByAdmin(actorId, input);
    if (!result.success) return { success: false, error: adminErrorMessage(result.error) };
    refreshSellerPages(sellerId);
    return {
      success: true,
      message:
        result.data.status === "already_applied"
          ? "This adjustment was already posted; nothing changed"
          : `Posted. New balance EGP ${result.data.balanceAfter}`,
    };
  } catch (error) {
    logServerError("wallet", "admin adjustment failed", { sellerId }, error);
    return { success: false, error: adminErrorMessage("generic") };
  }
}

/** A message to this seller's dashboard bell and devices (F-06f, 0131). */
export async function sendSellerNotificationAction(input: unknown): Promise<ActionResult> {
  const actorId = await adminActor();
  if (!actorId) return { success: false, error: adminErrorMessage("not_admin") };
  const sellerId = sellerIdOf(input);

  try {
    const result = await sendSellerMessageByAdmin(actorId, input);
    if (!result.success) return { success: false, error: adminErrorMessage(result.error) };
    if (sellerId) revalidatePath(`/sellers/${sellerId}`);
    return { success: true, message: "Sent. The seller sees it in their bell and on their devices." };
  } catch (error) {
    logServerError("admin", "seller notification failed", { sellerId }, error);
    return { success: false, error: adminErrorMessage("generic") };
  }
}
