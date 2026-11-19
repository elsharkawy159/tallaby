import { db, eq, sellers } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { finalizeStoreBuildIntake } from "@workspace/lib/store-builds/server";
import { DASHBOARD_URL } from "@/lib/marketing/site.lib";
import {
  clientIp,
  completeBurstLimiter,
  intakeError,
  intakeOk,
  readJsonBody,
  storeBuilderEnabled,
} from "@/lib/store-build/intake-request.server";
import { createClient } from "@/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/store-build/intake/complete (ROADMAP.md F-82d). After the browser
 * uploaded through the signed URLs: checks each object (one we signed, size,
 * type read from its first bytes) and records its path. A signed-in seller
 * (the session is shared on .tallaby.com) gets `continueUrl`, the dashboard
 * claim link with the single-use token (valid 10 minutes); everyone else
 * goes on to the signup dialog with the intake.
 *
 * Body: { intakeId, token }
 * 200: { ok: true, intakeId, continueUrl? }
 * 400 invalid_input · 404 not_found (or builder off) · 422 invalid_file · 429 rate_limited · 500 failed
 */
export async function POST(request: Request) {
  if (!storeBuilderEnabled()) return intakeError("unavailable");
  if (!completeBurstLimiter.check(clientIp(request.headers))) return intakeError("rate_limited");

  const body = await readJsonBody(request);
  if (body === undefined) return intakeError("invalid_input");

  try {
    const result = await finalizeStoreBuildIntake(body);
    if (!result.success) return intakeError(result.error);

    const token = (body as { token: string }).token;
    return intakeOk({ intakeId: result.intakeId, continueUrl: await sellerContinueUrl(result.intakeId, token) });
  } catch (error) {
    logServerError("integration", "store build intake complete failed", {}, error);
    return intakeError("failed");
  }
}

/** The dashboard claim link, only for a visitor who is signed in as a seller. */
async function sellerContinueUrl(intakeId: string, token: string): Promise<string | undefined> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.is_anonymous) return undefined;
    const [seller] = await db.select({ id: sellers.id }).from(sellers).where(eq(sellers.id, user.id)).limit(1);
    if (!seller) return undefined;
    const params = new URLSearchParams({ intake: intakeId, token });
    return `${DASHBOARD_URL}api/store-build/claim?${params.toString()}`;
  } catch {
    return undefined;
  }
}
