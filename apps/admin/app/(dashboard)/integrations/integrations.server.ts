"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreIntegrationsWithSummary } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { applyIntegrationAdminAction } from "@workspace/lib/admin/server";
import { adminActorId, saasError, type AdminActionResult } from "../_lib/saas-admin.server";

/**
 * Force-disconnect or clear the error of one store integration
 * (docs/admin-saas.md §3.5). Audited; the storefront drops the store's
 * tracking scripts and the admin summary refreshes.
 */
export async function integrationAdminAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return saasError("not_admin");
  try {
    const result = await applyIntegrationAdminAction(actorId, input);
    if (!result.success) return saasError(result.error);
    const { sellerId, storeId } = result.data;
    await applyInvalidation(invalidateStoreIntegrationsWithSummary(sellerId, storeId), { from: "admin", mode: "action" });
    revalidatePath("/integrations");
    revalidatePath(`/stores/${storeId}`);
    revalidatePath(`/sellers/${sellerId}`);
    const disconnected = (input as { action?: string }).action === "disconnect_integration";
    return { success: true, message: disconnected ? "Integration disconnected and logged" : "Error cleared and logged" };
  } catch (error) {
    logServerError("integration", "admin integration action failed", {}, error);
    return saasError("generic");
  }
}
