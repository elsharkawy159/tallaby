import { db, eq, sellers, sql } from "@workspace/db";
import { shouldAskHeardAboutUs } from "./heard-about-us.lib";

/** True while the seller should be asked the "where did you hear about us" pop-up (0099). */
export async function needsHeardAboutUs(sellerId: string): Promise<boolean> {
  try {
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
    // Column missing before 0099 is applied, or a DB hiccup: never block the dashboard.
    return false;
  }
}
