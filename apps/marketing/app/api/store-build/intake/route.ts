import { logServerError } from "@workspace/db/log";
import { createStoreBuildIntake, hashIntakeIp } from "@workspace/lib/store-builds/server";
import {
  clientIp,
  intakeBurstLimiter,
  intakeError,
  intakeOk,
  readJsonBody,
  storeBuilderEnabled,
} from "@/lib/store-build/intake-request.server";

export const dynamic = "force-dynamic";

/**
 * POST /api/store-build/intake (ROADMAP.md F-82d). Saves what a visitor typed
 * in the tallaby.com hero composer before any account exists (no model call,
 * decision D2) and signs one upload URL per declared file into the private
 * `store-build-intake` bucket (`guest/<intakeId>/…`). The raw token goes back
 * to the browser only; the row keeps its hash.
 *
 * Body: { prompt, primaryColor?, locale, file?: { type, size }, logo?: { type, size }, fileSummary? }
 * 200: { ok: true, intakeId, token, uploads: [{ kind, path, token, signedUrl, contentType }] }
 * 400 invalid_input · 404 unavailable (builder off) · 429 rate_limited · 500 failed
 */
export async function POST(request: Request) {
  if (!storeBuilderEnabled()) return intakeError("unavailable");
  const ip = clientIp(request.headers);
  if (!intakeBurstLimiter.check(ip)) return intakeError("rate_limited");

  const body = await readJsonBody(request);
  if (body === undefined) return intakeError("invalid_input");

  try {
    const result = await createStoreBuildIntake(body, { ipHash: hashIntakeIp(ip) });
    if (!result.success) return intakeError(result.error);
    return intakeOk({ intakeId: result.intakeId, token: result.token, uploads: result.uploads });
  } catch (error) {
    logServerError("integration", "store build intake failed", {}, error);
    return intakeError("failed");
  }
}
