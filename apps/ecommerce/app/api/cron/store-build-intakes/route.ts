import { type NextRequest, NextResponse } from "next/server";
import { logServerError } from "@workspace/db/log";
import { purgeExpiredStoreBuildIntakes } from "@workspace/lib/store-builds/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily (vercel.json): deletes hero composer intakes (ROADMAP.md F-82d, 0157)
 * that expired unclaimed after 48 hours, with their files in the private
 * `store-build-intake` bucket. Claimed intakes are kept. Idempotent; logs
 * counts only.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await purgeExpiredStoreBuildIntakes({ limit: 500 });
    return NextResponse.json(result);
  } catch (error) {
    logServerError("integration", "store build intake purge failed", {}, error);
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}
