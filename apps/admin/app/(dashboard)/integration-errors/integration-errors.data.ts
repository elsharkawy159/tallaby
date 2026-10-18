import { logServerError } from "@workspace/db/log";
import { listIntegrationErrors } from "@workspace/lib/admin/server";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";

/**
 * Store integrations in `error` across all sellers (PLAN.md P9-03). Provider,
 * store, seller, last error and time only; never credentials or config.
 */
export async function getIntegrationErrors() {
  await getCurrentAdminUser();
  try {
    return { rows: await listIntegrationErrors(200), failed: false };
  } catch (error) {
    logServerError("integration", "admin error list failed", {}, error);
    return { rows: [], failed: true };
  }
}
