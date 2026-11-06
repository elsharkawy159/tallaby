"use server";

import { revalidatePath } from "next/cache";
import {
  applyInvalidation,
  invalidateSeller,
  invalidateSellerProducts,
  invalidateStorefront,
  mergeInvalidations,
} from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { restoreAccountByAdmin } from "@workspace/lib/admin/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";

type ActionResult = { success: true; message: string } | { success: false; error: string };

const ERRORS: Record<string, string> = {
  not_admin: "You don't have permission to restore accounts.",
  invalid_input: "Check the note (1,000 characters at most).",
  not_found: "This request no longer exists.",
  not_allowed: "Only an account that is still waiting for its purge can be restored.",
  user_gone: "This account was already deleted.",
};

/**
 * Restores a closed account before its purge (ROADMAP.md F-82): the seller
 * status it had, the sign-in ban lifted, the storefront caches dropped so the
 * stores come back online.
 */
export async function restoreAccountAction(input: { requestId: string; note: string | null }): Promise<ActionResult> {
  let actorId: string;
  try {
    actorId = (await validateAdminAccess("canManageUsers")).id;
  } catch {
    return { success: false, error: ERRORS.not_admin! };
  }
  try {
    const result = await restoreAccountByAdmin(actorId, input);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "Something went wrong." };
    await applyInvalidation(
      mergeInvalidations(invalidateSeller(result.sellerId), invalidateSellerProducts(result.sellerId), invalidateStorefront(result.subdomains)),
      { from: "admin", mode: "action" },
    ).catch(() => undefined);
    revalidatePath("/account-deletions");
    revalidatePath(`/account-deletions/${input.requestId}`);
    return {
      success: true,
      message: result.unbanned
        ? "Account restored. The seller can sign in again."
        : "Account restored, but lifting the sign-in ban failed. Unban the user in Supabase › Authentication.",
    };
  } catch (error) {
    logServerError("admin", "account restore failed", { requestId: input?.requestId ?? null }, error);
    return { success: false, error: "Something went wrong. Try again." };
  }
}
