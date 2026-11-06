"use server";

import { revalidatePath } from "next/cache";
import { logServerError } from "@workspace/db/log";
import { updateAccountDeletionByAdmin } from "@workspace/lib/admin/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";

type ActionResult = { success: true; message: string } | { success: false; error: string };

const ERRORS: Record<string, string> = {
  not_admin: "You don't have permission to update account deletion requests.",
  invalid_input: "Check the status. A decline needs a note (1,000 characters at most).",
  not_found: "This request no longer exists.",
  not_allowed: "A cancelled or completed request can't be changed.",
  unchanged: "Nothing changed.",
};

/**
 * Saves an account deletion request's status and note (ROADMAP.md F-82). This
 * never deletes the user: do that first in Supabase, then mark it completed.
 */
export async function updateAccountDeletionAction(input: { requestId: string; status: string; note: string | null }): Promise<ActionResult> {
  let actorId: string;
  try {
    actorId = (await validateAdminAccess("canManageUsers")).id;
  } catch {
    return { success: false, error: ERRORS.not_admin! };
  }
  try {
    const result = await updateAccountDeletionByAdmin(actorId, input);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "Something went wrong." };
    revalidatePath("/account-deletions");
    revalidatePath(`/account-deletions/${input.requestId}`);
    return { success: true, message: "Saved." };
  } catch (error) {
    logServerError("admin", "account deletion update failed", { requestId: input?.requestId ?? null }, error);
    return { success: false, error: "Something went wrong. Try again." };
  }
}
