import { type NextRequest, NextResponse } from "next/server";
import { purgeExpiredFormSubmissions } from "@workspace/lib/store-forms/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily (vercel.json): deletes store form submissions older than 12 months
 * (customer PII retention, PLAN.md D28, P4-10). Idempotent, so a retried or
 * missed run is harmless.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    const deleted = await purgeExpiredFormSubmissions();
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error("form-submissions-retention failed:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}
