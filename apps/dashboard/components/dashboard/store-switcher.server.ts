"use server";

import { cookies } from "next/headers";
import { getStore } from "@workspace/lib/stores/server";
import { isUuid } from "@/lib/auth/access.lib";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { SELECTED_STORE_COOKIE } from "@/lib/stores/current-store.server";

/**
 * Remembers which store the sidebar's store-scoped links open. Only the
 * seller's own stores are accepted. Navigation preference only (PLAN.md §7.1).
 */
export async function selectStore(storeId: string): Promise<{ success: boolean }> {
  const seller = await requireSeller();
  // A non-uuid id would make Postgres throw on the uuid column; refuse it cleanly.
  if (typeof storeId !== "string" || !isUuid(storeId)) return { success: false };
  const store = await getStore(seller.sellerId, storeId);
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
