"use server";

import { revalidatePath } from "next/cache";
import { logServerError } from "@workspace/db/log";
import { countSellerAudience, sendSellerBroadcastByAdmin, type SellerAudienceCount } from "@workspace/lib/admin/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";

/**
 * Admin › Seller notifications: the live audience count and the group send.
 * Both check the admin session (`canManageUsers`, like the one-seller dialog);
 * the send re-checks the admin in the database, refuses a count that changed
 * since the admin confirmed it, and audits every recipient
 * (@workspace/lib/admin/seller-broadcast.server.ts).
 */

async function adminActor(): Promise<string | null> {
  try {
    return (await validateAdminAccess("canManageUsers")).id;
  } catch {
    return null;
  }
}

export async function countSellerAudienceAction(
  audience: unknown,
): Promise<{ success: true; data: SellerAudienceCount } | { success: false; error: string }> {
  if (!(await adminActor())) return { success: false, error: "Only verified admins can do this." };
  try {
    const data = await countSellerAudience(audience);
    return data ? { success: true, data } : { success: false, error: "Choose who receives it." };
  } catch (error) {
    logServerError("admin", "seller audience count failed", {}, error);
    return { success: false, error: "Couldn't count the sellers. Try again." };
  }
}

export type SellerBroadcastActionResult =
  | { success: true; message: string }
  | { success: false; error: string; count?: number };

const ERRORS: Record<string, string> = {
  not_admin: "Only verified admins can send notifications.",
  invalid_input: "Check the title, message and link, then try again.",
  audience_changed: "The number of sellers changed since you counted. Check the new number and confirm again.",
  too_many: "This group is too large to send at once.",
  already_sent: "This message was already sent to these sellers.",
};

export async function sendSellerBroadcastAction(input: unknown): Promise<SellerBroadcastActionResult> {
  const actorId = await adminActor();
  if (!actorId) return { success: false, error: ERRORS.not_admin! };
  try {
    const result = await sendSellerBroadcastByAdmin(actorId, input);
    if (!result.success) {
      return { success: false, error: ERRORS[result.error] ?? "Something went wrong. Try again.", count: result.count };
    }
    revalidatePath("/audit");
    const { sent, skipped } = result.data;
    return {
      success: true,
      message: `Sent to ${sent} seller${sent === 1 ? "" : "s"}${skipped ? ` (${skipped} already had it)` : ""}. They see it in their bell and on their devices.`,
    };
  } catch (error) {
    logServerError("admin", "seller broadcast failed", {}, error);
    return { success: false, error: "Something went wrong. Nothing was sent. Try again." };
  }
}
