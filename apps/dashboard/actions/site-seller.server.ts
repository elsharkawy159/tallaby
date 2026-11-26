import { cache } from "react";
import { db, eq, sellers } from "@workspace/db";
import { getSessionUser } from "@/lib/auth/session.server";

/**
 * The few `sellers` columns the dashboard shell needs (sidebar identity, the
 * support WhatsApp message, the store link). `getSiteData` sends its result to
 * the browser through `SiteDataProvider`, so this selects only these columns
 * instead of the full row that `getSellerProfile` returns. Not a server action:
 * no "use server", so the client can't call it. Memoized per request.
 */
export const getSiteSellerSummary = cache(async () => {
  try {
    const user = await getSessionUser();
    if (!user?.id) throw new Error("Unauthorized");

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.id, user.id),
      columns: { businessName: true, logoUrl: true, subdomain: true },
    });
    if (!seller) throw new Error("Seller profile not found");

    return { success: true as const, data: seller };
  } catch (error) {
    console.error("Error fetching seller summary:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
