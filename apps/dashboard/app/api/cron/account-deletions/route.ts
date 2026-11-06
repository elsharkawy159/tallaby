import { NextResponse } from "next/server";
import { purgeDueAccountDeletions } from "@workspace/lib/account-deletion/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Daily purge of closed seller accounts past their 30 days (ROADMAP.md F-82,
 * 0157): deletes the auth user, which cascades to everything they owned
 * (0134), and marks the request completed.
 */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  return NextResponse.json(await purgeDueAccountDeletions());
}

export const GET = run;
export const POST = run;
