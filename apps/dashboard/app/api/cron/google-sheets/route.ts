import { type NextRequest, NextResponse } from "next/server";
import { readGoogleClientEnv } from "@workspace/lib/integrations";
import { exportStoreOrdersToSheet, listStoresForDailySheetExport } from "@workspace/lib/integrations/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily (vercel.json): appends each connected store's new orders to its
 * Google Sheet and refreshes existing rows (PLAN.md §9.2, P7-06). Same secret
 * header as the ecommerce crons. The export is idempotent by order id, so a
 * retried or doubled run is harmless. 404 when Google OAuth is not configured.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const client = readGoogleClientEnv();
  if (!client) return new NextResponse("Not found", { status: 404 });

  const targets = await listStoresForDailySheetExport();
  const summary = { stores: targets.length, ok: 0, errors: 0, appended: 0 };
  for (const { sellerId, storeId } of targets) {
    const result = await exportStoreOrdersToSheet(sellerId, storeId, client).catch(() => null);
    if (result?.success) {
      summary.ok++;
      summary.appended += result.data.appended;
    } else {
      summary.errors++;
      console.error(`google-sheets cron: store ${storeId} failed:`, result && !result.success ? result.error : "exception");
    }
  }
  return NextResponse.json(summary);
}
