"use server";

import { revalidatePath } from "next/cache";
import { saveStoreLeadTemplate, setStoreCheckoutLeadContacted } from "@workspace/lib/checkout-leads/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";

/**
 * Orders › Not completed actions (0120, ROADMAP.md F-03). Every action takes
 * an explicit storeId, re-checked against the session's seller (requireStore);
 * the queries are scoped by that seller again. Never cached.
 */

export type MissedOrdersResult = { success: true } | { success: false; error: "notFound" | "readOnly" | "tooLong" | "generic" };

const accessResult = (error: unknown): MissedOrdersResult => {
  if (isAccessError(error)) {
    return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
  }
  console.error("[missed-orders] action failed");
  return { success: false, error: "generic" };
};

export async function setLeadContacted(input: { storeId: string; leadId: string; contacted: boolean }): Promise<MissedOrdersResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const ok = await setStoreCheckoutLeadContacted(seller.sellerId, {
      storeId: store.id,
      leadId: String(input?.leadId ?? ""),
      contacted: Boolean(input?.contacted),
      userId: seller.userId,
    });
    if (!ok) return { success: false, error: "notFound" };
    revalidatePath("/orders/missed");
    return { success: true };
  } catch (error) {
    return accessResult(error);
  }
}

export async function saveLeadTemplate(input: { storeId: string; template: string | null }): Promise<MissedOrdersResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const template = typeof input?.template === "string" ? input.template : null;
    const result = await saveStoreLeadTemplate(seller.sellerId, { storeId: store.id, template });
    if (!result.success) return { success: false, error: result.error === "too_long" ? "tooLong" : "notFound" };
    revalidatePath("/orders/missed");
    return { success: true };
  } catch (error) {
    return accessResult(error);
  }
}
