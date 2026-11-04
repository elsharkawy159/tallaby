import { NextResponse } from "next/server";
import { expireManualOrderLinks } from "@workspace/lib/orders/manual/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Daily: cancels order links nobody confirmed and puts their stock back (ROADMAP.md F-05c). */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json(await expireManualOrderLinks());
}

export const GET = run;
export const POST = run;
