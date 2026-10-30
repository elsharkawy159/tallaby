import { type NextRequest, NextResponse } from "next/server";
import { logServerError } from "@workspace/db/log";
import { purgeExpiredTrash } from "@workspace/lib/products/trash/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Daily (vercel.json): deletes products that have been in Trash for more than
 * 30 days (0123, ROADMAP.md F-35e), oldest first, in batches. A product that
 * orders still point to keeps its row (stamped purged_at). Idempotent; logs
 * counts only.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await purgeExpiredTrash({ limit: 500 });
    return NextResponse.json(result);
  } catch (error) {
    logServerError("integration", "product trash purge failed", {}, error);
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }
}
