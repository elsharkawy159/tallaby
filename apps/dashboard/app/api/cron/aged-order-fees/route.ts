import { NextResponse } from "next/server";
import { db } from "@workspace/db";
import { chargeAgedOrderFees } from "@workspace/db/wallet";

export const maxDuration = 300;

/**
 * Daily: while `fee_on_delivery` is on, an order created since the switch went
 * on that is still open 14 days later pays its fee (owner, 2026-11-26;
 * PLAN.md §13.3). Does nothing while the switch is off. Safe to run twice:
 * the `order:<id>` claim never charges a seller twice.
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json(await chargeAgedOrderFees(db));
}

export const GET = run;
export const POST = run;
