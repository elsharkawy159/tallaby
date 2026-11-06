"use server";

import { revalidatePath } from "next/cache";
import { logServerError } from "@workspace/db/log";
import { updateThemeRequestByAdmin } from "@workspace/lib/admin/server";
import { sendThemeRequestUpdateEmail } from "@workspace/lib/orders";
import { validateAdminAccess } from "@/lib/auth/admin-auth";

type ActionResult = { success: true; message: string } | { success: false; error: string };

const ERRORS: Record<string, string> = {
  not_admin: "You don't have permission to update theme requests.",
  invalid_input: "Check the status and the reply (2,000 characters at most).",
  not_found: "This request no longer exists.",
  unchanged: "Nothing changed.",
};

/**
 * Saves a theme request's status and reply (ROADMAP.md F-77). A status change
 * to in progress, ready or declined writes the seller's bell row (pushed by
 * the dispatcher) in the same transaction; ready and declined then ask the
 * backend for the email, once per outcome (its delivery claim).
 */
export async function updateThemeRequestAction(input: {
  requestId: string;
  status: string;
  reply: string | null;
}): Promise<ActionResult> {
  let actorId: string;
  try {
    actorId = (await validateAdminAccess("canManageUsers")).id;
  } catch {
    return { success: false, error: ERRORS.not_admin! };
  }
  try {
    const result = await updateThemeRequestByAdmin(actorId, input);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "Something went wrong." };
    // After the commit; best effort (logged, never fails the save).
    if (result.email) await sendThemeRequestUpdateEmail(input.requestId);
    revalidatePath("/theme-requests");
    revalidatePath(`/theme-requests/${input.requestId}`);
    const told = result.notified ? (result.email ? " The seller was notified and emailed." : " The seller was notified.") : "";
    return { success: true, message: `Saved.${told}` };
  } catch (error) {
    logServerError("admin", "theme request update failed", { requestId: input?.requestId ?? null }, error);
    return { success: false, error: "Something went wrong. Try again." };
  }
}
