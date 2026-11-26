import { cache } from "react";
import { getSessionUser } from "@/lib/auth/session.server";
import { loadSeller } from "@/lib/auth/require-seller.server";

/**
 * The few `sellers` columns the dashboard shell needs (sidebar identity, the
 * support WhatsApp message, the store link). `getSiteData` sends its result to
 * the browser through `SiteDataProvider`, so this returns only these columns
 * instead of the full row that `getSellerProfile` returns. Not a server action:
 * no "use server", so the client can't call it. Memoized per request, and read
 * from `loadSeller`'s row (the layout's access check already loaded it), so it
 * costs no query of its own.
 */
export const getSiteSellerSummary = cache(async () => {
  try {
    const user = await getSessionUser();
    if (!user?.id) throw new Error("Unauthorized");

    const seller = await loadSeller(user.id);
    if (!seller) throw new Error("Seller profile not found");

    return {
      success: true as const,
      data: { businessName: seller.businessName, logoUrl: seller.logoUrl, subdomain: seller.subdomain },
    };
  } catch (error) {
    console.error("Error fetching seller summary:", error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
