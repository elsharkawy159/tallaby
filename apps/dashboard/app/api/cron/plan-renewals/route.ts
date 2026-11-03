import { NextResponse } from "next/server";
import { renewDuePlans } from "@workspace/lib/billing/plans";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Daily Pro renewals from the store wallet (ROADMAP.md F-55d). Does nothing before the USD switch. */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json(await renewDuePlans());
}

export const GET = run;
export const POST = run;
