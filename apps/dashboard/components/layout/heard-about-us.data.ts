import { db, eq, sellers } from "@workspace/db";

/** True while the seller has not answered the "where did you hear about us" pop-up (0099). */
export async function needsHeardAboutUs(sellerId: string): Promise<boolean> {
  try {
    const [row] = await db
      .select({ answeredAt: sellers.heardAboutUsAt })
      .from(sellers)
      .where(eq(sellers.id, sellerId))
      .limit(1);
    return Boolean(row) && !row!.answeredAt;
  } catch {
    // Column missing before 0099 is applied, or a DB hiccup: never block the dashboard.
    return false;
  }
}
