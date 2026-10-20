"use server";

import { cookies } from "next/headers";
import { getStore } from "@workspace/lib/stores/server";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { SELECTED_STORE_COOKIE } from "@/lib/stores/current-store.server";

/**
 * Remembers which store the sidebar's store-scoped links open. Only the
 * seller's own stores are accepted. Navigation preference only (PLAN.md §7.1).
 */
export async function selectStore(storeId: string): Promise<{ success: boolean }> {
  const seller = await requireSeller();
  const store = await getStore(seller.sellerId, String(storeId));
  if (!store) return { success: false };
  (await cookies()).set(SELECTED_STORE_COOKIE, store.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return { success: true };
}
