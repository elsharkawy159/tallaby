import { type NextRequest, NextResponse } from "next/server";
import { and, carts, db, eq, gt, isNull, lte, sql } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { sendAbandonedCartEmail } from "@workspace/lib/orders";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Carts idle this long get one reminder… */
const IDLE_AFTER = "1 day";
/** …unless they went quiet longer ago than this (matches the admin pending-carts window). */
const GIVE_UP_AFTER = "7 days";
const BATCH = 200;

/**
 * Daily (vercel.json): one "you left something in your cart" email per active
 * cart idle for 1–7 days. The backend skips empty carts, guests and customers
 * who turned marketing mail off, sends once per cart (email_deliveries claim)
 * and stamps `carts.reminder_sent_at`, so a retried run is harmless.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const candidates = await db
    .select({ id: carts.id })
    .from(carts)
    .where(
      and(
        eq(carts.status, "active"),
        isNull(carts.reminderSentAt),
        lte(carts.lastActivity, sql`now() - ${IDLE_AFTER}::interval`),
        gt(carts.lastActivity, sql`now() - ${GIVE_UP_AFTER}::interval`),
        sql`exists (select 1 from cart_items ci where ci.cart_id = ${carts.id} and coalesce(ci.saved_for_later, false) = false)`,
      ),
    )
    .orderBy(carts.lastActivity)
    .limit(BATCH);

  const summary = { candidates: candidates.length, requested: 0, errors: 0 };
  for (const cart of candidates) {
    const result = await sendAbandonedCartEmail(cart.id);
    if (result.success) summary.requested++;
    else {
      summary.errors++;
      logServerError("email", "abandoned cart reminder failed", { cartId: cart.id, error: result.error ?? null });
    }
  }

  return NextResponse.json(summary);
}
