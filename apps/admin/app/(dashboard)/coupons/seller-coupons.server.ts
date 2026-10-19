"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateSellerCoupons } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { setSellerCouponActiveByAdmin } from "@workspace/lib/admin/server";
import { adminActorId, saasError, type AdminActionResult } from "../_lib/saas-admin.server";

/**
 * Switch a seller's coupon off or back on (docs/admin-saas.md §3.2, D-A1).
 * Audited in the same transaction; the storefront and the seller dashboard
 * drop that seller's cached coupons.
 */
export async function toggleSellerCouponAction(input: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageProducts");
  if (!actorId) return saasError("not_admin");
  try {
    const result = await setSellerCouponActiveByAdmin(actorId, input);
    if (!result.success) return saasError(result.error);
    await applyInvalidation(invalidateSellerCoupons(result.data.sellerId), { from: "admin", mode: "action" });
    revalidatePath("/coupons");
    const active = (input as { active?: boolean }).active === true;
    return { success: true, message: active ? "Coupon reactivated and logged" : "Coupon deactivated and logged" };
  } catch (error) {
    logServerError("admin", "seller coupon toggle failed", {}, error);
    return saasError("generic");
  }
}
