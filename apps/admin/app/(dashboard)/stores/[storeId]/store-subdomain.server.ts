"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateCustomDomain, invalidateStorefront, mergeInvalidations } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { changeStoreSubdomainByAdmin } from "@workspace/lib/admin/server";
import { adminActorId, type AdminActionResult } from "../../_lib/saas-admin.server";
import { storeSubdomainError } from "./store-subdomain.lib";

/**
 * "Edit subdomain" on the store page (owner request 2026-11-12). The admin
 * check (`canManageUsers`, re-checked in the database), the store's owner,
 * the subdomain rules and the audit row all live in
 * `changeStoreSubdomainByAdmin`, which moves the store with the seller's own
 * `updateStoreSubdomain`: the old address becomes a redirect to the new one.
 * The cache is cleared like the seller's own change: the storefront under
 * both names and the custom domain lookup.
 */
export async function changeStoreSubdomainAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return { success: false, error: storeSubdomainError("not_admin") };
  const raw = (input && typeof input === "object" ? input : {}) as { storeId?: unknown; subdomain?: unknown; reason?: unknown };

  try {
    const result = await changeStoreSubdomainByAdmin(actorId, {
      storeId: raw.storeId,
      subdomain: typeof raw.subdomain === "string" ? raw.subdomain.slice(0, 64) : raw.subdomain,
      reason: raw.reason,
    });
    if (!result.success) return { success: false, error: storeSubdomainError(result.error) };

    const { storeId, sellerId, subdomain, previous, customDomain } = result.data;
    await applyInvalidation(
      mergeInvalidations(
        invalidateStorefront([previous, subdomain]),
        ...(customDomain ? [invalidateCustomDomain(subdomain, customDomain)] : []),
      ),
      { from: "admin", mode: "action" },
    );
    revalidatePath(`/stores/${storeId}`, "layout");
    revalidatePath("/stores");
    revalidatePath(`/sellers/${sellerId}`);
    return { success: true, message: `The store is now at ${subdomain}.tallaby.com. ${previous}.tallaby.com redirects there. Logged.` };
  } catch (error) {
    logServerError("admin", "store subdomain change failed", { storeId: typeof raw.storeId === "string" ? raw.storeId : null }, error);
    return { success: false, error: storeSubdomainError("generic") };
  }
}
