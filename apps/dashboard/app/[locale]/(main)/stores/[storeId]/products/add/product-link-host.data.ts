import { db, sellerCustomDomains } from "@workspace/db";
import { and, eq } from "drizzle-orm";

/**
 * The seller's live custom domain (e.g. faster-egy.com), shown in the product
 * form's link preview instead of the Tallaby host. A seller has at most one
 * (unique on seller_id). Always filtered by the session's seller.
 */
export async function loadProductLinkHost(sellerId: string): Promise<string | null> {
  const [row] = await db
    .select({ domain: sellerCustomDomains.domain })
    .from(sellerCustomDomains)
    .where(and(eq(sellerCustomDomains.sellerId, sellerId), eq(sellerCustomDomains.status, "active")))
    .limit(1);
  return row?.domain ?? null;
}
