import { NextResponse, type NextRequest } from "next/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { builderEnabled } from "@/app/(main)/ai-builder/builder-access.server";
import { toView } from "@/app/(main)/ai-builder/builder-chat.server";
import { activateProducts, loadReview, regenerateSiteCopy, runBuildStep, type RunContext } from "@/app/(main)/ai-builder/builder-run.server";
import { builderBuildBodySchema, type BuilderBuildResponse, type BuilderErrorCode } from "@/app/(main)/ai-builder/builder.dto";
import { buildItemKeys, buildProgress } from "@/app/(main)/ai-builder/builder.lib";
import { acquireLease, loadBuild, loadItems, releaseLease } from "@/app/(main)/ai-builder/builder.store.server";

/**
 * Runs an AI Store Builder build, one step per request (ROADMAP.md F-54d): there
 * is no job queue and a route has 60 s. The browser calls again until it's done,
 * so a closed tab loses nothing. A lease stops two tabs running the same build.
 */

export const maxDuration = 60;

const burstLimiter = createRateLimiter({ limit: 120, windowMs: 60_000 });

const STATUS: Partial<Record<BuilderErrorCode, number>> = {
  unauthorized: 401,
  disabled: 404,
  badInput: 400,
  rateLimited: 429,
  notBuilding: 409,
  locked: 409,
  budget: 402,
  noCredits: 402,
  dailyLimit: 429,
  regenerateLimit: 429,
  failed: 500,
};

const fail = (error: BuilderErrorCode) => NextResponse.json<BuilderBuildResponse>({ ok: false, error }, { status: STATUS[error] ?? 422 });

export async function POST(request: NextRequest) {
  if (!builderEnabled()) return fail("disabled");

  let ctx: RunContext;
  try {
    const seller = await requireSeller({ forWrite: true });
    ctx = { sellerId: seller.sellerId, userId: seller.userId, sellerStatus: seller.status };
  } catch (error) {
    if (isAccessError(error)) return fail("unauthorized");
    throw error;
  }
  if (!burstLimiter.check(ctx.sellerId)) return fail("rateLimited");

  const parsed = builderBuildBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("badInput");
  const { action, buildId } = parsed.data;

  // Filtered by the session's seller: another seller's build id finds nothing.
  const build = await loadBuild(ctx.sellerId, buildId);
  if (!build) return fail("notBuilding");

  if (!(await acquireLease(ctx.sellerId, build.id))) return fail("locked");
  try {
    if (action === "step") {
      if (build.status !== "building") {
        const progress = buildProgress(buildItemKeys(build.state), await loadItems(build.id));
        if (build.status !== "review") return fail("notBuilding");
        return NextResponse.json<BuilderBuildResponse>({ ok: true, view: toView(build), progress, review: await loadReview(ctx, build) });
      }
      const step = await runBuildStep(ctx, build);
      return NextResponse.json<BuilderBuildResponse>({
        ok: true,
        view: toView(step.build),
        progress: step.progress,
        review: step.finished ? await loadReview(ctx, step.build) : null,
      });
    }

    if (build.status !== "review") return fail("notBuilding");
    if (action === "regenerate") {
      const result = await regenerateSiteCopy(ctx, build);
      if (result !== "ok") return fail(result === "limit" ? "regenerateLimit" : result);
    } else {
      await activateProducts(ctx, build);
    }
    const fresh = (await loadBuild(ctx.sellerId, build.id)) ?? build;
    return NextResponse.json<BuilderBuildResponse>({
      ok: true,
      view: toView(fresh),
      progress: buildProgress(buildItemKeys(fresh.state), await loadItems(fresh.id)),
      review: await loadReview(ctx, fresh),
    });
  } catch (error) {
    console.error("[ai-builder] build step failed", error instanceof Error ? error.message : error);
    return fail("failed");
  } finally {
    await releaseLease(ctx.sellerId, build.id);
  }
}
