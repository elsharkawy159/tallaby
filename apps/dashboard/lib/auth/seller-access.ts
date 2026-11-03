import { cache } from "react";
import type { SellerStatus } from "@/lib/utils/seller";
import { loadSeller } from "./require-seller.server";

/**
 * Dashboard access is decided by the `sellers` row, not by `users.role` or
 * `user_metadata.is_seller`: the row is what onboarding reliably creates, and
 * its `status` is the field admins actually change. Metadata is a cache that
 * can drift; the row cannot.
 */
export type SellerAccess =
  // "restricted" means limited access, not none: the seller keeps the
  // dashboard (e.g. to ship open orders) and sees a notice.
  | { allowed: true; status: "approved" | "restricted" }
  | { allowed: false; reason: "no_seller" }
  | { allowed: false; reason: "pending" | "suspended" };

export const getSellerAccess = cache(
  async (userId: string): Promise<SellerAccess> => {
    const seller = await loadSeller(userId);

    if (!seller) return { allowed: false, reason: "no_seller" };

    const status = (seller.status ?? "pending") as SellerStatus;
    if (status === "approved" || status === "restricted") return { allowed: true, status };
    return { allowed: false, reason: status };
  }
);
