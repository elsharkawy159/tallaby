"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import {
  archiveStore,
  checkStoreSubdomain,
  createStore,
  getStore,
  restoreStore,
} from "@workspace/lib/stores/server";
import { requireSeller, isAccessError } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { SELECTED_STORE_COOKIE } from "@/lib/stores/current-store.server";
import type { SubdomainCheckResult } from "@/components/stores/subdomain-field.client";
import type { StoreActionResult } from "./stores.dto";

/**
 * My stores (PLAN.md §8.0, P3-02). The seller comes from the session; the
 * plan limit, ownership and subdomain rules are enforced in
 * @workspace/lib/stores/server, never in the UI.
 */

const checkLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });
const createLimiter = createRateLimiter({ limit: 10, windowMs: 60 * 60_000 });

async function clientKey(prefix: string): Promise<string> {
  const h = await headers();
  return `${prefix}:${h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown"}`;
}

/**
 * The storefront caches the store lookup by subdomain, including "not found",
 * so creating, archiving or restoring a store must clear that entry.
 */
async function refresh(subdomain?: string) {
  if (subdomain) {
    await applyInvalidation(invalidateStorefront([subdomain]), { from: "dashboard", mode: "action" });
  }
  revalidatePath("/stores");
  // The sidebar switcher lives in the (main) layout.
  revalidatePath("/", "layout");
}

async function guard<T>(run: () => Promise<StoreActionResult<T>>): Promise<StoreActionResult<T>> {
  try {
    return await run();
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "forbidden" };
    console.error("[stores] action failed", error);
    return { success: false, error: "generic" };
  }
}

export async function checkNewStoreSubdomain(input: string): Promise<SubdomainCheckResult> {
  const seller = await requireSeller();
  if (!checkLimiter.check(await clientKey(seller.sellerId))) {
    return { status: "rateLimited", subdomain: input, suggestions: [] };
  }
  return checkStoreSubdomain(seller.sellerId, String(input ?? "").slice(0, 64));
}

export async function createStoreAction(input: {
  name: string;
  subdomain: string;
}): Promise<StoreActionResult<{ id: string }>> {
  return guard(async () => {
    const seller = await requireSeller({ forWrite: true });
    if (!createLimiter.check(await clientKey(seller.sellerId))) return { success: false, error: "rateLimited" };

    const result = await createStore(seller.sellerId, {
      name: String(input?.name ?? ""),
      subdomain: String(input?.subdomain ?? ""),
    });
    if (!result.success) {
      const map = { limit_reached: "limitReached", taken: "subdomainTaken", invalid_input: "invalidInput" } as const;
      const error = map[result.error as keyof typeof map] ?? (result.error === "no_seller" ? "forbidden" : "invalidSubdomain");
      return { success: false, error };
    }

    // Open the new store in the sidebar (navigation preference only).
    (await cookies()).set(SELECTED_STORE_COOKIE, result.data.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    await refresh(result.data.subdomain);
    return { success: true, data: { id: result.data.id } };
  });
}

export async function archiveStoreAction(storeId: string): Promise<StoreActionResult<null>> {
  return guard(async () => {
    const seller = await requireSeller({ forWrite: true });
    const store = await getStore(seller.sellerId, String(storeId));
    const result = await archiveStore(seller.sellerId, String(storeId));
    if (!result.success) return { success: false, error: result.error === "primary_store" ? "primaryStore" : "notFound" };
    await refresh(store?.subdomain);
    return { success: true, data: null };
  });
}

export async function restoreStoreAction(storeId: string): Promise<StoreActionResult<null>> {
  return guard(async () => {
    const seller = await requireSeller({ forWrite: true });
    const store = await getStore(seller.sellerId, String(storeId));
    const result = await restoreStore(seller.sellerId, String(storeId));
    if (!result.success) return { success: false, error: "notFound" };
    await refresh(store?.subdomain);
    return { success: true, data: null };
  });
}
