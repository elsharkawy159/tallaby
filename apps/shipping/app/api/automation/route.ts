import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  readAutomationSettings,
  runAutoAssign,
  runAutoConfirm,
} from "@/lib/automation";
import { revalidateShipping } from "@/app/(admin)/orders/orders.query";

/**
 * The headless half of Auto Confirm / Auto Assign.
 *
 * A database trigger (0022_shipping_automation.sql) POSTs here through pg_net
 * whenever an order enters a stage an enabled toggle covers. That is what lets
 * a 3am website order be confirmed and assigned without anyone having the
 * dispatch page open — the alternative, running automation from the browser,
 * only works while someone is watching.
 *
 * Authenticated by a shared secret rather than a user session, so it must be
 * excluded from the session proxy (see proxy.ts's matcher).
 */

export const dynamic = "force-dynamic";

const payloadSchema = z.object({
  kind: z.enum(["confirm", "assign"]),
  /** Omitted for a full sweep; present when a trigger names the order it saw. */
  orderId: z.uuid().optional(),
});

function secretMatches(provided: string | null): boolean {
  const expected = process.env.SHIPPING_AUTOMATION_SECRET;
  if (!expected || !provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, which would itself leak length.
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!secretMatches(request.headers.get("x-automation-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { kind, orderId } = parsed.data;

  try {
    // The toggle is re-read here, not trusted from the trigger: it may have
    // been switched off between the write that fired the webhook and this
    // request landing.
    const settings = await readAutomationSettings();

    if (kind === "confirm") {
      if (!settings.autoConfirm) {
        return NextResponse.json({ skipped: "auto_confirm_disabled" });
      }

      const confirmed = await runAutoConfirm(orderId);
      if (confirmed > 0) revalidateShipping(orderId);

      // Confirming moves the order into the Confirmed stage. The UPDATE fires
      // the trigger again, which posts the 'assign' kind — so this does not
      // chain here, and a disabled Auto Assign simply leaves it in Confirmed.
      return NextResponse.json({ confirmed });
    }

    if (!settings.autoAssign) {
      return NextResponse.json({ skipped: "auto_assign_disabled" });
    }

    const outcome = await runAutoAssign(orderId);
    if (outcome.ok) revalidateShipping(orderId);

    return NextResponse.json(
      outcome.ok ? { assigned: outcome.assigned, batchId: outcome.batchId } : { skipped: outcome.code }
    );
  } catch (error) {
    console.error("[automation] failed", error);
    return NextResponse.json({ error: "Automation failed" }, { status: 500 });
  }
}
