import { NextResponse } from "next/server";
import { db } from "@workspace/db";
import { chargeAgedOrderFees } from "@workspace/db/wallet";
import { expireManualOrderLinks } from "@workspace/lib/orders/manual/server";

export const maxDuration = 300;

/**
 * Daily: cancels order links nobody confirmed and puts their stock back
 * (ROADMAP.md F-05c), then runs the 14-day order fee job (fee on delivery,
 * owner 2026-11-26; `/api/cron/aged-order-fees` runs the same job on its own).
 * The fee job rides on this scheduled task until its own Coolify task exists;
 * it is safe to run twice (the `order:<id>` claim never charges a seller
 * twice), so keeping both is harmless. It runs after the links expire, so a
 * link cancelled today is never charged, and its failure never hides the
 * links result.
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const links = await expireManualOrderLinks();
  let agedOrderFees: unknown;
  try {
    agedOrderFees = await chargeAgedOrderFees(db);
  } catch (error) {
    console.error("[fee] aged order fees failed in manual-order-links", error instanceof Error ? error.message : error);
    agedOrderFees = { error: "failed" };
  }
  return NextResponse.json({ ...links, agedOrderFees });
}

export const GET = run;
export const POST = run;
