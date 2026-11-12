import { type NextRequest, NextResponse } from "next/server";
import { deleteStaleCustomerUploads } from "@workspace/lib/products/customer-fields/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Daily (vercel.json): deletes customer photos for "Customer requirements"
 * (ROADMAP.md F-91) uploaded more than 7 days ago that no order line and no
 * cart line holds (private bucket `order-customer-uploads`, 0167). Up to 200
 * per run; idempotent, since a deleted file is no longer listed. Counts only.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    return NextResponse.json(await deleteStaleCustomerUploads());
  } catch (error) {
    console.error("[customer-uploads] cron failed", (error as Error)?.message);
    return NextResponse.json({ error: "Customer upload cleanup failed" }, { status: 500 });
  }
}
