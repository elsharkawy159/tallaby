import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, sellers } from "@workspace/db";
import { getAuthResult } from "@/lib/auth/session.server";

/**
 * The session seller's full `sellers` row, for server code only (settings page,
 * product add/edit pricing). Not a server action: no "use server", so the
 * browser can't call it; callers pass on only the fields the UI needs.
 * Memoized per request.
 */
export const getSellerProfile = cache(async () => {
  try {
    const { data, error } = await getAuthResult();
    if (error) throw new Error(error.message);
    if (!data?.user?.id) {
      throw new Error("Unauthorized");
    }

    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.id, data.user.id),
    });

    if (!seller) {
      throw new Error("Seller profile not found");
    }

    return { success: true, data: seller };
  } catch (error) {
    console.error("Error fetching seller profile:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
});
