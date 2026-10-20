"use server";

import { revalidatePath } from "next/cache";
import { logServerError } from "@workspace/db/log";
import { reviewManualStoreTopUp } from "@workspace/lib/admin/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";

/**
 * Store top-ups (owner request 2026-10-18): manual Vodafone Cash / InstaPay
 * top-ups with a receipt. Approving credits the seller's store wallet through
 * reviewManualStoreTopUp (one audited, idempotent transaction).
 */

type ActionResult = { success: true; message: string } | { success: false; error: string };

const ERRORS: Record<string, string> = {
  not_admin: "You don't have permission to review top-ups.",
  invalid_input: "Add a reason (at least 3 characters) to reject.",
  not_found: "This top-up no longer exists.",
  already_reviewed: "This top-up was already reviewed.",
  wallet_not_active: "The seller's wallet isn't active, so nothing was credited.",
};

async function adminActor(): Promise<string | null> {
  try {
    return (await validateAdminAccess("canManageUsers")).id;
  } catch {
    return null;
  }
}


export async function reviewStoreTopUpAction(input: {
  topUpId: string;
  decision: "approve" | "reject";
  reason?: string;
}): Promise<ActionResult> {
  const actorId = await adminActor();
  if (!actorId) return { success: false, error: ERRORS.not_admin! };
  try {
    const result = await reviewManualStoreTopUp(actorId, input);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "Something went wrong." };
    revalidatePath("/store-top-ups");
    revalidatePath("/wallets", "layout");
    return {
      success: true,
      message:
        result.data.status === "approved"
          ? `Approved. New balance EGP ${result.data.balanceAfter}`
          : "Rejected. The seller sees your reason.",
    };
  } catch (error) {
    logServerError("wallet", "store top-up review failed", { topUpId: input?.topUpId ?? null }, error);
    return { success: false, error: "Something went wrong. Try again." };
  }
}
