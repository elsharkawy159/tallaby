import { type NextRequest, NextResponse } from "next/server";
import { INTAKE_SIGNED_IN_MAX_AGE_MS, isIntakeId, isIntakeToken } from "@workspace/lib/store-builds";
import { claimStoreBuildIntake } from "@workspace/lib/store-builds/server";
import { loadSeller } from "@/lib/auth/require-seller.server";
import { getSessionUser } from "@/lib/auth/session.server";

export const dynamic = "force-dynamic";

/**
 * GET /api/store-build/claim?intake=<uuid>&token=<token> (ROADMAP.md F-82d).
 * A seller already signed in on tallaby.com lands here from the hero composer.
 * The intake is claimed for the SESSION seller (never an id from the URL),
 * with no store bound (the builder creates or picks one), and only within 10
 * minutes of being made; the token works once. Then on to the builder.
 * Responses never cache and never send the token on as a referrer.
 */
function go(request: NextRequest, path: string) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  const intakeId = request.nextUrl.searchParams.get("intake");
  const token = request.nextUrl.searchParams.get("token");
  if (!isIntakeId(intakeId) || !isIntakeToken(token)) return go(request, "/ai-builder");

  const user = await getSessionUser();
  if (!user) {
    // Proxy skips /api: sign in, then come back to this same link.
    const back = `/api/store-build/claim?${new URLSearchParams({ intake: intakeId, token }).toString()}`;
    return go(request, `/login?${new URLSearchParams({ next: back }).toString()}`);
  }
  const seller = await loadSeller(user.id);
  if (!seller) return go(request, "/signup?next=/ai-builder");

  try {
    const claim = await claimStoreBuildIntake({
      intakeId,
      token,
      sellerId: seller.id,
      storeId: null,
      maxAgeMs: INTAKE_SIGNED_IN_MAX_AGE_MS,
    });
    if (claim.success) return go(request, `/ai-builder?intake=${claim.intakeId}`);
    console.warn("[store-build claim] not claimed", claim.error);
  } catch (error) {
    console.error("[store-build claim] failed", error instanceof Error ? error.message : error);
  }
  return go(request, "/ai-builder");
}
