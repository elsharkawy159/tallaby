"use server";

import { revalidatePath } from "next/cache";
import {
  cancelAccountDeletionRequest,
  createAccountDeletionRequest,
  getSellerAccountDeletion,
} from "@workspace/lib/account-deletion/server";
import type { SellerAccountDeletionView } from "@workspace/lib/account-deletion";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";

/**
 * Settings › Delete my account (ROADMAP.md F-82, 0157). The user always comes
 * from the session. A request is handled by the Tallaby team within 30 days;
 * nothing is deleted here.
 */

export type AccountDeletionActionResult =
  | { success: true; request: SellerAccountDeletionView | null }
  | { success: false; error: "invalidInput" | "alreadyPending" | "notFound" | "forbidden" | "generic" };

async function current(userId: string): Promise<SellerAccountDeletionView | null> {
  return getSellerAccountDeletion(userId).catch(() => null);
}

export async function requestAccountDeletionAction(input: { reason?: string; confirmed?: boolean }): Promise<AccountDeletionActionResult> {
  try {
    const seller = await requireSeller();
    const result = await createAccountDeletionRequest({
      userId: seller.userId,
      input: { reason: input?.reason, confirmed: input?.confirmed },
    });
    if (!result.success) return { success: false, error: result.error === "already_pending" ? "alreadyPending" : "invalidInput" };
    revalidatePath("/settings");
    return { success: true, request: await current(seller.userId) };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "forbidden" };
    console.error("[account-deletion] request failed");
    return { success: false, error: "generic" };
  }
}

export async function cancelAccountDeletionAction(): Promise<AccountDeletionActionResult> {
  try {
    const seller = await requireSeller();
    const result = await cancelAccountDeletionRequest(seller.userId);
    if (!result.success) return { success: false, error: "notFound" };
    revalidatePath("/settings");
    return { success: true, request: await current(seller.userId) };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "forbidden" };
    console.error("[account-deletion] cancel failed");
    return { success: false, error: "generic" };
  }
}
