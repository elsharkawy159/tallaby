"use server";

import { revalidatePath } from "next/cache";
import { logServerError } from "@workspace/db/log";
import { updateBillingSettingsByAdmin } from "@workspace/lib/admin/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";

type ActionResult = { success: true; message: string } | { success: false; error: string };

const ERRORS: Record<string, string> = {
  not_admin: "You don't have permission to change billing.",
  invalid_input: "Check the margin (0 to 20%) and the fixed rate (10 to 500).",
  no_change: "Nothing to save: these are the current settings.",
};

/** Margin, fixed rate and tax switch. Never the USD switch itself. */
export async function updateBillingSettingsAction(input: unknown): Promise<ActionResult> {
  let actorId: string;
  try {
    actorId = (await validateAdminAccess("canManageSettings")).id;
  } catch {
    return { success: false, error: ERRORS.not_admin! };
  }
  try {
    const result = await updateBillingSettingsByAdmin(actorId, input);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "Something went wrong." };
    revalidatePath("/billing");
    return { success: true, message: "Saved and logged" };
  } catch (error) {
    logServerError("admin", "billing settings update failed", {}, error);
    return { success: false, error: "Something went wrong. Try again." };
  }
}
