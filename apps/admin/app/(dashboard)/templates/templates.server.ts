"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateTemplateCatalog } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { setDefaultTemplateByAdmin, updateTemplateByAdmin } from "@workspace/lib/admin/server";
import { adminActorId, saasError, type AdminActionResult } from "../_lib/saas-admin.server";

async function done(message: string): Promise<AdminActionResult> {
  await applyInvalidation(invalidateTemplateCatalog(), { from: "admin", mode: "action" });
  revalidatePath("/templates");
  return { success: true, message };
}

/** Active, premium, price and order of one template (docs/admin-saas.md §3.6). Audited. */
export async function updateTemplateAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageSettings");
  if (!actorId) return saasError("not_admin");
  try {
    const result = await updateTemplateByAdmin(actorId, input);
    if (!result.success) return saasError(result.error);
    return done("Template updated and logged");
  } catch (error) {
    logServerError("admin", "template update failed", {}, error);
    return saasError("generic");
  }
}

/** Makes one template the default for new stores. Audited. */
export async function setDefaultTemplateAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageSettings");
  if (!actorId) return saasError("not_admin");
  try {
    const result = await setDefaultTemplateByAdmin(actorId, input);
    if (!result.success) return saasError(result.error);
    return done("Default template changed and logged");
  } catch (error) {
    logServerError("admin", "template default change failed", {}, error);
    return saasError("generic");
  }
}
