import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { getSessionUser } from "@/lib/auth/session.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { builderEnabled } from "@/app/(main)/ai-builder/builder-access.server";
import { answerQuestion, refreshBrief, toView, type ChatResult } from "@/app/(main)/ai-builder/builder-chat.server";
import { BUILDER_LIMITS, builderChatBodySchema, type BuilderChatResponse, type BuilderErrorCode } from "@/app/(main)/ai-builder/builder.dto";
import { withNextQuestion } from "@/app/(main)/ai-builder/builder.lib";
import { abandonBuild, loadOpenBuild, saveBuild, startBuild, type BuildRow } from "@/app/(main)/ai-builder/builder.store.server";

/**
 * The AI Store Builder's conversation (ROADMAP.md F-54c). The seller comes from
 * the session; a build id is never taken from the client here. Answers are saved
 * on the server, so a closed tab resumes.
 */

export const maxDuration = 60;

// Bursts per instance; each model call has its own cross-instance limits (builder.store.server.ts).
const burstLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

const STATUS: Partial<Record<BuilderErrorCode, number>> = {
  unauthorized: 401,
  disabled: 404,
  badInput: 400,
  tooLong: 413,
  rateLimited: 429,
  tooManyBuilds: 429,
  creditsNotLive: 402,
  notBuilding: 409,
  failed: 500,
};

const fail = (error: BuilderErrorCode, status = STATUS[error] ?? 422) => NextResponse.json<BuilderChatResponse>({ ok: false, error }, { status });

const clientIp = (request: NextRequest) => request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || null;

const answer = (result: ChatResult) =>
  result.error
    ? NextResponse.json<BuilderChatResponse>({ ok: false, error: result.error, view: result.view }, { status: STATUS[result.error] ?? 422 })
    : NextResponse.json<BuilderChatResponse>({ ok: true, view: result.view });

export async function POST(request: NextRequest) {
  if (!builderEnabled()) return fail("disabled");
  if (Number(request.headers.get("content-length") ?? 0) > BUILDER_LIMITS.textMax * 8 + 2048) return fail("tooLong");

  let sellerId: string;
  try {
    sellerId = (await requireSeller({ forWrite: true })).sellerId;
  } catch (error) {
    if (isAccessError(error)) return fail("unauthorized");
    throw error;
  }
  if (!burstLimiter.check(sellerId)) return fail("rateLimited");

  const parsed = builderChatBodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("badInput");
  const body = parsed.data;

  const user = await getSessionUser();
  const ctx = { sellerId, emailConfirmed: Boolean(user?.email_confirmed_at), ip: clientIp(request) };

  try {
    if (body.action === "start" || body.action === "restart") {
      if (body.action === "restart") {
        const open = await loadOpenBuild(sellerId);
        // A running build stays: its products and store are real.
        if (open?.status === "building") return fail("notBuilding");
        if (open) await abandonBuild(sellerId, open.id);
      }
      const started = await startBuild(sellerId, withNextQuestion);
      if (!started.ok) return fail(started.error);
      return answer(await refreshBrief(ctx, started.build));
    }

    const build = await loadOpenBuild(sellerId);
    if (!build || build.status !== "collecting") return fail("notBuilding");

    if (body.action === "answer") return answer(await answerQuestion(ctx, build, body.answer));
    if (body.action === "saveProduct") return answer(await saveProduct(build, body.product));
    if (body.action === "removeProduct") return answer(await removeProduct(build, body.productId));
    return answer(await removePhoto(build, body.productId, body.path));
  } catch (error) {
    console.error("[ai-builder] chat failed", error instanceof Error ? error.message : error);
    return fail("failed");
  }
}

type ProductInput = Extract<ReturnType<typeof builderChatBodySchema.parse>, { action: "saveProduct" }>["product"];

/** A form edit: no model, and no text the model could have got wrong. */
async function saveProduct(build: BuildRow, input: ProductInput) {
  const { products } = build.state;
  const existing = input.id ? products.find((product) => product.id === input.id) : undefined;
  if (input.id && !existing) return { view: toView(build), error: "badInput" as const };
  if (!existing && products.length >= BUILDER_LIMITS.products) return { view: toView(build), error: "tooManyProducts" as const };
  const product = {
    id: existing?.id ?? randomUUID().slice(0, 12),
    name: input.name,
    details: input.details,
    price: input.price,
    compareAtPrice: input.compareAtPrice !== null && input.price !== null && input.compareAtPrice > input.price ? input.compareAtPrice : null,
    stock: input.unlimited ? null : input.stock,
    unlimited: input.unlimited,
    photos: existing?.photos ?? [],
  };
  const state = { ...build.state, products: existing ? products.map((p) => (p.id === product.id ? product : p)) : [...products, product] };
  await saveBuild(build.sellerId, build.id, { state });
  return { view: toView({ ...build, state }) };
}

async function removeProduct(build: BuildRow, productId: string) {
  const state = { ...build.state, products: build.state.products.filter((product) => product.id !== productId) };
  await saveBuild(build.sellerId, build.id, { state });
  return { view: toView({ ...build, state }) };
}

async function removePhoto(build: BuildRow, productId: string, path: string) {
  const state = {
    ...build.state,
    products: build.state.products.map((product) => (product.id === productId ? { ...product, photos: product.photos.filter((photo) => photo !== path) } : product)),
  };
  await saveBuild(build.sellerId, build.id, { state });
  return { view: toView({ ...build, state }) };
}
