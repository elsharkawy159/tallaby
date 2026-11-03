import { NextResponse } from "next/server";
import { refreshExchangeRate } from "@workspace/lib/billing/server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** Daily EGP-per-USD rate (ROADMAP.md F-56b). A failure keeps the last rate; Admin › Billing shows its age. */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const result = await refreshExchangeRate();
  if (!result.ok) console.error("[billing] exchange rate fetch failed", result.reason);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export const GET = run;
export const POST = run;
