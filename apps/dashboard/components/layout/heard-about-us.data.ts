import { cache } from "react";
import { db, eq, sellers, sql } from "@workspace/db";
import { loadSeller } from "@/lib/auth/require-seller.server";
import { shouldAskHeardAboutUs } from "./heard-about-us.lib";

/**
 * True while the seller should be asked the "where did you hear about us" pop-up (0099).
 * Once per request. The answer comes from loadSeller's row (already read by the
 * access check), so a seller who answered costs no query.
 */
export const needsHeardAboutUs = cache(async (sellerId: string): Promise<boolean> => {
  try {
    const seller = await loadSeller(sellerId);
    if (!seller || seller.heardAboutUsAt) return false;
    const [row] = await db
      .select({
        answeredAt: sellers.heardAboutUsAt,
        // The first store's created_at. Not fee_trial_started_at: new sellers have no trial since 0119.
        firstStoreAt: sql<string | null>`(SELECT min(st.created_at)::text FROM stores st WHERE st.seller_id = ${sellerId})`,
      })
      .from(sellers)
      .where(eq(sellers.id, sellerId))
      .limit(1);
    return Boolean(row) && shouldAskHeardAboutUs(row!);
  } catch {
    // A DB hiccup: never block the dashboard.
    return false;
  }
});
