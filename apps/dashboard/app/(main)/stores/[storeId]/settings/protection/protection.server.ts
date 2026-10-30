"use server";

import { revalidatePath } from "next/cache";
import { and, db, eq, sql, stores } from "@workspace/db";
import { blockPhoneSchema, normalizeBlockedPhone } from "@workspace/lib/stores/blocked-phones";
import {
  blockStorePhone,
  unblockStorePhone,
  type StoreBlockedPhone,
} from "@workspace/lib/stores/blocked-phones/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { ORDER_CONFIRM_TEMPLATE_MAX } from "../../../../orders/order-confirm.lib";
import type { BlockedCustomersErrorKey, BlockedCustomersResult } from "./protection.dto";

/**
 * Store settings › Order protection (ROADMAP.md F-02c, F-02g). storeId is explicit
 * and re-checked with requireStore; every write is scoped to that store.
 * Never log the phone.
 */

const writeLimiter = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });

function accessErrorKey(error: unknown): BlockedCustomersErrorKey | null {
  if (!isAccessError(error)) return null;
  return error.code === "store_read_only" ? "readOnly" : "notFound";
}

function revalidate(storeId: string) {
  revalidatePath(`/stores/${storeId}/settings/protection`);
  revalidatePath("/orders");
}

export async function blockCustomerPhone(
  storeId: string,
  input: { phone: string; reason?: string },
): Promise<BlockedCustomersResult<StoreBlockedPhone>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!writeLimiter.check(`blocked:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const parsed = blockPhoneSchema.safeParse({ phone: input?.phone ?? "", reason: input?.reason });
    if (!parsed.success) return { success: false, error: "phoneInvalid" };

    const row = await blockStorePhone({
      storeId: store.id,
      phone: parsed.data.phone,
      reason: parsed.data.reason,
      createdBy: seller.userId,
    });
    revalidate(store.id);
    return { success: true, data: row };
  } catch (error) {
    const key = accessErrorKey(error);
    if (key) return { success: false, error: key };
    console.error("[blocked-customers] block failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

/** Unblocks a row of the list (`id`) or the phone on an order (`phone`). */
export async function unblockCustomerPhone(
  storeId: string,
  target: { id: string } | { phone: string },
): Promise<BlockedCustomersResult<null>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!writeLimiter.check(`blocked:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    let match: { id: string } | { phone: string };
    if (target && "id" in target && typeof target.id === "string") {
      match = { id: target.id };
    } else {
      const phone = target && "phone" in target ? normalizeBlockedPhone(String(target.phone)) : null;
      if (!phone) return { success: false, error: "phoneInvalid" };
      match = { phone };
    }
    if ("id" in match && !/^[0-9a-f-]{36}$/i.test(match.id)) return { success: false, error: "notFound" };

    const removed = await unblockStorePhone(store.id, match);
    if (!removed) return { success: false, error: "notFound" };
    revalidate(store.id);
    return { success: true, data: null };
  } catch (error) {
    const key = accessErrorKey(error);
    if (key) return { success: false, error: key };
    console.error("[blocked-customers] unblock failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

/**
 * Saves the store's WhatsApp "please confirm" template (ROADMAP.md F-02g) in
 * `stores.settings.orderConfirm`; an empty template goes back to the default.
 * Other settings keys are kept.
 */
export async function saveOrderConfirmTemplate(
  storeId: string,
  template: string,
): Promise<BlockedCustomersResult<string | null>> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!writeLimiter.check(`blocked:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const value = typeof template === "string" ? template.trim() : "";
    if (value.length > ORDER_CONFIRM_TEMPLATE_MAX) return { success: false, error: "templateTooLong" };

    await db
      .update(stores)
      .set({
        settings: value
          ? sql`coalesce(${stores.settings}, '{}'::jsonb) || jsonb_build_object('orderConfirm', jsonb_build_object('template', ${value}::text))`
          : sql`coalesce(${stores.settings}, '{}'::jsonb) - 'orderConfirm'`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(stores.id, store.id), eq(stores.sellerId, seller.sellerId)));
    revalidate(store.id);
    return { success: true, data: value || null };
  } catch (error) {
    const key = accessErrorKey(error);
    if (key) return { success: false, error: key };
    console.error("[order-protection] template save failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
