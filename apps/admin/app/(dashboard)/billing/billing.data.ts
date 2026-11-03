// Read-only, for the Server Component page; deliberately not "use server".
import { logServerError } from "@workspace/db/log";
import { getBillingOverview, type BillingOverview } from "@workspace/lib/admin/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";

/** Null when the admin may not see it or the read fails, so the page can say so. Never cached. */
export async function getBillingPageData(): Promise<BillingOverview | null> {
  try {
    await validateAdminAccess("canManageSettings");
  } catch {
    return null;
  }
  try {
    return await getBillingOverview();
  } catch (error) {
    logServerError("admin", "billing page load failed", {}, error);
    return null;
  }
}
