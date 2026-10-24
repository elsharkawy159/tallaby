import { db, eq, sellers } from "@workspace/db";
import { shouldAskHeardAboutUs } from "./heard-about-us.lib";

/** True while the seller should be asked the "where did you hear about us" pop-up (0099). */
export async function needsHeardAboutUs(sellerId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ answeredAt: sellers.heardAboutUsAt, firstStoreAt: sellers.feeTrialStartedAt })
      .from(sellers)
      .where(eq(sellers.id, sellerId))
      .limit(1);
    return Boolean(row) && shouldAskHeardAboutUs(row!);
  } catch {
    // Column missing before 0099 is applied, or a DB hiccup: never block the dashboard.
    return false;
  }
}
