"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreCms } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { unpublishCmsItemByAdmin } from "@workspace/lib/admin/server";
import { adminActorId, saasError, type AdminActionResult } from "../_lib/saas-admin.server";

/** Unpublish one blog/CMS item of a store (abuse), audited (docs/admin-saas.md §3.3). */
export async function unpublishCmsItemAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageProducts");
  if (!actorId) return saasError("not_admin");
  try {
    const result = await unpublishCmsItemByAdmin(actorId, input);
    if (!result.success) return saasError(result.error);
    const { sellerId, storeId } = result.data;
    await applyInvalidation(invalidateStoreCms(sellerId, storeId), { from: "admin", mode: "action" });
    revalidatePath(`/stores/${storeId}`);
    return { success: true, message: "Item unpublished and logged" };
  } catch (error) {
    logServerError("admin", "cms unpublish failed", {}, error);
    return saasError("generic");
  }
}
