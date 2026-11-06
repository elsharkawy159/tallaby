"use server";

import { redirect } from "next/navigation";
import {
  applyInvalidation,
  invalidateSeller,
  invalidateSellerProducts,
  invalidateStorefront,
  mergeInvalidations,
} from "@workspace/cache";
import { closeSellerAccount } from "@workspace/lib/account-deletion/server";
import { ACCOUNT_DELETION_PUBLIC_PATH } from "@workspace/lib/account-deletion";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createClient } from "@/supabase/server";

/**
 * Settings › Delete my account (ROADMAP.md F-82, 0157). The user always comes
 * from the session. The account closes at once (suspended, auth banned,
 * storefronts offline, signed out everywhere); the data is purged by the
 * account-deletions cron after 30 days. The wallet balance is lost (owner,
 * 2026-11-06). On success this redirects to the public deletion page.
 */

export type CloseAccountActionResult = {
  success: false;
  error: "invalidInput" | "alreadyClosed" | "forbidden" | "generic";
};

export async function closeAccountAction(input: { reason?: string; confirmed?: boolean }): Promise<CloseAccountActionResult> {
  try {
    const seller = await requireSeller();
    const result = await closeSellerAccount({
      userId: seller.userId,
      input: { reason: input?.reason, confirmed: input?.confirmed },
    });
    if (!result.success) {
      return { success: false, error: result.error === "already_closed" ? "alreadyClosed" : result.error === "no_seller" ? "forbidden" : "invalidInput" };
    }
    if (!result.banned) console.error("[account-deletion] auth ban failed; the suspended seller status still blocks the account");

    // Storefronts and product pages only resolve for an approved seller: drop their caches now.
    await applyInvalidation(
      mergeInvalidations(invalidateSeller(seller.userId), invalidateSellerProducts(seller.userId), invalidateStorefront(result.subdomains)),
      { from: "dashboard", mode: "action" },
    ).catch(() => console.error("[account-deletion] cache invalidation failed"));

    // Every session on every device (the ban also blocks new sign-ins and refreshes).
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "global" }).catch(() => undefined);
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "forbidden" };
    console.error("[account-deletion] close failed");
    return { success: false, error: "generic" };
  }
  redirect(`${ACCOUNT_DELETION_PUBLIC_PATH}?closed=1`);
}
