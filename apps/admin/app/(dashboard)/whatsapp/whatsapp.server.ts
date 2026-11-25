"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logServerError } from "@workspace/db/log";
import { WHATSAPP_RETRY_ERROR_MESSAGES, WHATSAPP_RETRY_MAX, WHATSAPP_SETTINGS_ERROR_MESSAGES } from "@workspace/lib/whatsapp/admin";
import {
  retryWhatsAppMessages,
  submitWhatsAppTemplates,
  syncWhatsAppTemplates,
  updateWhatsAppAdminSettings,
} from "@workspace/lib/whatsapp/admin/server";
import { adminActorId, type AdminActionResult } from "../_lib/saas-admin.server";
import { isMissingMigration } from "./whatsapp.data";
import { BACKEND_ERROR_MESSAGES, templateSummaryText } from "./whatsapp.lib";

/**
 * Admin › WhatsApp actions (ROADMAP.md F-109, docs/whatsapp.md §6). Same
 * permission as Billing (canManageSettings). The lib re-checks the admin in
 * the database and writes admin_audit_log; the Meta token never leaves the
 * backend. No action here can set a seller price above 0 (D3).
 */

const GENERIC = "Something went wrong. Try again.";
const MIGRATION_MISSING = "Database migration 0180 not applied.";

export async function updateWhatsAppSettingsAction(input: unknown): Promise<AdminActionResult> {
  const adminId = await adminActorId("canManageSettings");
  if (!adminId) return { success: false, error: WHATSAPP_SETTINGS_ERROR_MESSAGES.not_admin };
  try {
    const result = await updateWhatsAppAdminSettings(adminId, input);
    if (!result.success) return { success: false, error: WHATSAPP_SETTINGS_ERROR_MESSAGES[result.error] ?? GENERIC };
    revalidatePath("/whatsapp");
    return { success: true, message: "Saved and logged" };
  } catch (error) {
    if (isMissingMigration(error)) return { success: false, error: MIGRATION_MISSING };
    logServerError("admin", "whatsapp settings update failed", {}, error);
    return { success: false, error: GENERIC };
  }
}

const retrySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(WHATSAPP_RETRY_MAX),
  confirmUnknown: z.boolean(),
});

export async function retryWhatsAppMessagesAction(input: unknown): Promise<AdminActionResult> {
  const adminId = await adminActorId("canManageSettings");
  if (!adminId) return { success: false, error: WHATSAPP_RETRY_ERROR_MESSAGES.not_admin };
  const parsed = retrySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: WHATSAPP_RETRY_ERROR_MESSAGES.invalid_input };
  try {
    const result = await retryWhatsAppMessages(adminId, parsed.data.ids, { confirmUnknown: parsed.data.confirmUnknown });
    if (!result.success) return { success: false, error: WHATSAPP_RETRY_ERROR_MESSAGES[result.error] ?? GENERIC };
    revalidatePath("/whatsapp");
    const n = result.data.count;
    return {
      success: true,
      message: `${n} ${n === 1 ? "message" : "messages"} queued again${result.data.dispatched ? "" : " (the worker will pick them up)"}`,
    };
  } catch (error) {
    if (isMissingMigration(error)) return { success: false, error: MIGRATION_MISSING };
    logServerError("admin", "whatsapp retry failed", {}, error);
    return { success: false, error: GENERIC };
  }
}

async function templateAction(kind: "submit" | "sync"): Promise<AdminActionResult> {
  const adminId = await adminActorId("canManageSettings");
  if (!adminId) return { success: false, error: "You don't have permission to manage WhatsApp templates." };
  try {
    const result = kind === "submit" ? await submitWhatsAppTemplates(adminId) : await syncWhatsAppTemplates(adminId);
    if (!result.ok) return { success: false, error: BACKEND_ERROR_MESSAGES[result.error] };
    revalidatePath("/whatsapp");
    return { success: true, message: templateSummaryText(kind, result.summary) };
  } catch (error) {
    logServerError("admin", `whatsapp templates ${kind} failed`, {}, error);
    return { success: false, error: GENERIC };
  }
}

export async function submitWhatsAppTemplatesAction(): Promise<AdminActionResult> {
  return templateAction("submit");
}

export async function syncWhatsAppTemplatesAction(): Promise<AdminActionResult> {
  return templateAction("sync");
}
