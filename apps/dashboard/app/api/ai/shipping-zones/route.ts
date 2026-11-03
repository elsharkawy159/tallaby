import { NextResponse, type NextRequest } from "next/server";
import { aiConfigured, aiErrorKind, checkDailyCap, logAiUsage, modelIdForTier } from "@workspace/ai";
import { db, eq, sellers } from "@workspace/db";
import { isProActive } from "@workspace/lib/billing";
import { claimAiCredit, getAiCreditStatus, refundAiCredit } from "@workspace/lib/billing/credits";
import { getBillingState } from "@workspace/lib/billing/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { proposeZones } from "@/app/(main)/stores/[storeId]/shipping/ai/ai-zones.server";
import {
  AI_ZONES_FEATURE,
  AI_ZONES_LIMITS,
  validateAiZonesText,
  type AiZonesErrorCode,
  type AiZonesResponse,
} from "@/app/(main)/stores/[storeId]/shipping/ai/ai-zones.dto";

/** "Describe your delivery areas" (ROADMAP.md F-45b): text → proposed zones. Never saves. */

export const maxDuration = 60;

// Same abuse guard as the product autofill: Pro's 2,000 credits a month need a higher cap.
const PRO_DAILY_MULTIPLIER = 10;

// Bursts per instance; the daily cap below is the real, cross-instance limit.
const burstLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });

const dailyLimit = () => {
  const value = Number(process.env.AI_SHIPPING_ZONES_DAILY_LIMIT);
  return Number.isInteger(value) && value >= 0 ? value : 10;
};

const STATUS: Record<AiZonesErrorCode, number> = {
  unauthorized: 401,
  notFound: 404,
  readOnly: 403,
  disabled: 503,
  empty: 400,
  tooLong: 413,
  noZones: 422,
  rateLimited: 429,
  dailyLimit: 429,
  noCredits: 402,
  busy: 503,
  timeout: 504,
  failed: 502,
};

const fail = (error: AiZonesErrorCode) => NextResponse.json<AiZonesResponse>({ ok: false, error }, { status: STATUS[error] });

/** Room for the longest allowed text in any encoding; the route checks the real length below. */
const MAX_BODY_BYTES = AI_ZONES_LIMITS.maxTextLength * 8 + 1024;

export async function POST(request: NextRequest) {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return fail("tooLong");

  let body: { storeId?: unknown; text?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail("empty");
  }

  // The store comes from the session seller; requireStore refuses a foreign or read-only one.
  let sellerId: string;
  try {
    sellerId = (await requireStore(String(body?.storeId ?? ""), { forWrite: true })).seller.sellerId;
  } catch (error) {
    if (!isAccessError(error)) throw error;
    if (error.code === "not_found") return fail("notFound");
    return fail(error.code === "store_read_only" ? "readOnly" : "unauthorized");
  }

  if (!aiConfigured()) return fail("disabled");

  const text = typeof body.text === "string" ? body.text : "";
  const invalid = validateAiZonesText(text);
  if (invalid) return fail(invalid);

  if (!burstLimiter.check(sellerId)) return fail("rateLimited");
  const billing = await getBillingState().catch(() => null);
  if (!billing) return fail("failed");
  const planRow = billing.usdLive
    ? (await db.select({ plan: sellers.plan, planExpiresAt: sellers.planExpiresAt, planGraceUntil: sellers.planGraceUntil }).from(sellers).where(eq(sellers.id, sellerId)))[0]
    : null;
  const limit = planRow && isProActive(planRow) ? dailyLimit() * PRO_DAILY_MULTIPLIER : dailyLimit();
  // Fails closed: without the usage table (0110) there is no cap, so no AI.
  const cap = await checkDailyCap(sellerId, AI_ZONES_FEATURE, limit).catch((error: unknown) => {
    console.error("[ai] daily cap check failed", error instanceof Error ? error.message : error);
    return null;
  });
  if (!cap) return fail("failed");
  if (!cap.allowed) {
    await logAiUsage({ sellerId, feature: AI_ZONES_FEATURE, model: modelIdForTier("fast"), status: "blocked", errorCode: "daily_limit" });
    return fail("dailyLimit");
  }

  // Credits (F-57): take one before the call, give it back if it fails or was cached.
  // Fails closed, like the cap: if credits can't be checked, no AI.
  let creditReference: string | null = null;
  if (billing.usdLive) {
    const claim = await claimAiCredit(sellerId, AI_ZONES_FEATURE).catch((error: unknown) => {
      console.error("[ai] credit claim failed", error instanceof Error ? error.message : error);
      return null;
    });
    if (!claim) return fail("failed");
    if (!claim.ok) {
      await logAiUsage({ sellerId, feature: AI_ZONES_FEATURE, model: modelIdForTier("fast"), status: "blocked", errorCode: "no_credits" });
      return fail("noCredits");
    }
    creditReference = claim.reference;
  }
  const giveBack = async () => {
    if (creditReference) await refundAiCredit(sellerId, creditReference).catch(() => {});
  };

  try {
    const { zones, cached } = await proposeZones(sellerId, text);
    // No zones means the seller got nothing for the credit.
    if (cached || !zones.length) await giveBack();
    if (!zones.length) return fail("noZones");
    const credits = billing.usdLive ? await getAiCreditStatus(sellerId).catch(() => null) : null;
    return NextResponse.json<AiZonesResponse>({
      ok: true,
      zones,
      // A cached answer made no model call, so it does not use up a call.
      remainingToday: Math.max(0, cap.remaining - (cached ? 0 : 1)),
      ...(credits && { creditsRemaining: credits.total }),
    });
  } catch (error) {
    await giveBack();
    // The usage rows (with the error codes) are written by generateStructured.
    console.error("[ai] shipping zones failed", error instanceof Error ? error.message : error);
    return fail(aiErrorKind(error));
  }
}
