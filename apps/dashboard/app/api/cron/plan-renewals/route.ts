import { NextResponse } from "next/server";
import { renewDueApps } from "@workspace/lib/billing/apps";
import { renewDuePlans } from "@workspace/lib/billing/plans";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Daily Pro and paid app renewals from the store wallet (ROADMAP.md F-55d, F-47). Does nothing before the USD switch. */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const plans = await renewDuePlans();
  const apps = await renewDueApps();
  return NextResponse.json({ ...plans, apps });
}

export const GET = run;
export const POST = run;
