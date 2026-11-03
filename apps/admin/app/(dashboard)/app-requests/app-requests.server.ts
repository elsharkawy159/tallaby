"use server";

import { revalidatePath } from "next/cache";
import { logServerError } from "@workspace/db/log";
import { reviewAppRequest } from "@workspace/lib/admin/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";

type ActionResult = { success: true; message: string } | { success: false; error: string };

const ERRORS: Record<string, string> = {
  not_admin: "You don't have permission to review app requests.",
  not_found: "This request no longer exists.",
  already_reviewed: "This request already has that status.",
};

/** Records the decision; the seller's card follows it. Sending SMS comes with F-38 (F-62c). */
export async function reviewAppRequestAction(input: {
  requestId: string;
  decision: "enable" | "decline";
}): Promise<ActionResult> {
  let actorId: string;
  try {
    actorId = (await validateAdminAccess("canManageUsers")).id;
  } catch {
    return { success: false, error: ERRORS.not_admin! };
  }
  try {
    const result = await reviewAppRequest(actorId, input);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "Something went wrong." };
    revalidatePath("/app-requests");
    return { success: true, message: result.status === "enabled" ? "Enabled." : "Declined." };
  } catch (error) {
    logServerError("integration", "app request review failed", { requestId: input?.requestId ?? null }, error);
    return { success: false, error: "Something went wrong. Try again." };
  }
}
