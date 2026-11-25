// Read-only, for the Server Component page; deliberately not "use server".
import { logServerError } from "@workspace/db/log";
import {
  getWhatsAppAdminSettings,
  getWhatsAppConnection,
  getWhatsAppUsage,
  listFailedWhatsAppMessages,
  listWhatsAppTemplates,
} from "@workspace/lib/whatsapp/admin/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";

/**
 * Admin › WhatsApp reads (ROADMAP.md F-109, docs/whatsapp.md §6). Same
 * permission as Billing. Never cached (rule 8). Each loader returns
 * `{ error }` instead of throwing, so the page always renders and says what
 * went wrong ("migration" when 0180 is not applied on this database).
 */

export type WhatsAppLoadError = "forbidden" | "migration" | "failed";
export type Loaded<T> = { data: T; error: null } | { data: null; error: WhatsAppLoadError };

/** Postgres undefined_table / undefined_column, also when wrapped by Drizzle: migration 0180 is missing. */
export function isMissingMigration(error: unknown): boolean {
  let e: unknown = error;
  for (let i = 0; e && i < 4; i++) {
    const code = (e as { code?: unknown }).code;
    if (code === "42P01" || code === "42703") return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

async function load<T>(label: string, read: (adminId: string) => Promise<T>): Promise<Loaded<T>> {
  let adminId: string;
  try {
    adminId = (await validateAdminAccess("canManageSettings")).id;
  } catch {
    return { data: null, error: "forbidden" };
  }
  try {
    return { data: await read(adminId), error: null };
  } catch (error) {
    if (isMissingMigration(error)) return { data: null, error: "migration" };
    logServerError("admin", `whatsapp ${label} load failed`, {}, error);
    return { data: null, error: "failed" };
  }
}

export const loadWhatsAppSettings = () => load("settings", (id) => getWhatsAppAdminSettings(id));

export const loadWhatsAppConnection = () => load("connection", (id) => getWhatsAppConnection(id));

export const loadWhatsAppTemplates = () => load("templates", (id) => listWhatsAppTemplates(id));

export const loadWhatsAppUsage = (days: unknown) => load("usage", (id) => getWhatsAppUsage(id, { days }));

export const loadFailedWhatsAppMessages = (page: unknown, code: unknown) =>
  load("failed messages", (id) => listFailedWhatsAppMessages(id, { page, code }));
