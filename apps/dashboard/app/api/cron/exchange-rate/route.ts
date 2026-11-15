import { NextResponse } from "next/server";
import { applyInvalidation, invalidateBillingRate } from "@workspace/cache";
import { getBillingState, refreshExchangeRate } from "@workspace/lib/billing/server";
import { shouldInvalidateMarketingRate } from "./exchange-rate.lib";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/** The rate tallaby.com shows (Admin override, else the latest fetch), or undefined when it can't be read. */
async function siteRate(): Promise<number | null | undefined> {
  try {
    return (await getBillingState()).marketRate;
  } catch (error) {
    console.error("[billing] billing state read failed", error);
    return undefined;
  }
}

/** EGP-per-USD rate, every 3 hours (ROADMAP.md F-56b). A failure keeps the last rate; Admin › Billing shows its age. */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const previous = await siteRate();
  const result = await refreshExchangeRate();
  if (!result.ok) console.error("[billing] exchange rate fetch failed", result.reason);
  // tallaby.com's prices show the rate from a cached read; clear it only when a shown EGP figure changes, or once a day (F-73).
  else {
    const next = await siteRate();
    // An unreadable rate (undefined) clears, as before this check existed.
    if (previous === undefined || next === undefined || shouldInvalidateMarketingRate({ previous, next, now: new Date() })) {
      await applyInvalidation(invalidateBillingRate(), { from: "dashboard", mode: "route" });
    }
  }
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

export const GET = run;
export const POST = run;
