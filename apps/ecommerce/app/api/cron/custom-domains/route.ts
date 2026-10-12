import { type NextRequest, NextResponse } from "next/server";
import { db, sellers, sellerCustomDomains, eq } from "@workspace/db";
import { applyInvalidation, invalidateCustomDomain } from "@workspace/cache";
import { refreshCustomDomain } from "@workspace/lib/storefront/server";
import { purgeExpiredHandoffCodes } from "@/lib/auth-handoff.server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily (vercel.json): re-checks every seller custom domain with Vercel.
 * Pending domains whose DNS is now right go live without the seller pressing
 * "Check now"; live domains whose DNS broke are marked failed so they stop
 * resolving and the seller sees why in the dashboard.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rows = await db
    .select({ row: sellerCustomDomains, subdomain: sellers.subdomain })
    .from(sellerCustomDomains)
    .innerJoin(sellers, eq(sellers.id, sellerCustomDomains.sellerId));

  const summary = { checked: 0, changed: 0, errors: 0 };
  for (const { row, subdomain } of rows) {
    try {
      const updated = await refreshCustomDomain(row);
      summary.checked++;
      if (updated.status !== row.status) {
        summary.changed++;
        await applyInvalidation(invalidateCustomDomain(subdomain, row.domain), {
          from: "ecommerce",
          mode: "route",
        });
      }
    } catch (error) {
      summary.errors++;
      console.error(`Custom domain check failed for ${row.domain}:`, error);
    }
  }

  await purgeExpiredHandoffCodes();
  return NextResponse.json(summary);
}
