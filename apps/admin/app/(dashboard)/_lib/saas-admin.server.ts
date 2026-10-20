// Plain server helpers for the Phase 9B admin actions (docs/admin-saas.md).
// Not "use server": the actions that import this declare it themselves.
import { SAAS_ADMIN_ERROR_MESSAGES } from "@workspace/lib/admin";
import { validateAdminAccess } from "@/lib/auth/admin-auth";

export type AdminActionResult = { success: true; message: string } | { success: false; error: string };

type Permission = Parameters<typeof validateAdminAccess>[0];

/** The signed-in admin's id when they hold `permission`, otherwise null. */
export async function adminActorId(permission: Permission = "canManageUsers"): Promise<string | null> {
  try {
    return (await validateAdminAccess(permission)).id;
  } catch {
    return null;
  }
}

export function saasError(code: string): AdminActionResult {
  return { success: false, error: SAAS_ADMIN_ERROR_MESSAGES[code] ?? "Something went wrong. Try again." };
}

/** Postgres undefined_column / check_violation on the 0069 columns: the migration is not applied yet. */
export function isMissingMigration(error: unknown): boolean {
  const code = (error as { code?: string })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "42703" || code === "23502";
}
