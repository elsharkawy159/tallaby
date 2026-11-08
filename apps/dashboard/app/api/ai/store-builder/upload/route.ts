import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { getServiceClient } from "@workspace/db/supabase/service";
import { builderEnabled } from "@/app/(main)/ai-builder/builder-access.server";
import { toView, withShortlist } from "@/app/(main)/ai-builder/builder-chat.server";
import { BUILDER_IMAGE_TYPES, BUILDER_LIMITS, type BuilderChatResponse, type BuilderErrorCode } from "@/app/(main)/ai-builder/builder.dto";
import { imageTypeOf } from "@/app/(main)/ai-builder/builder-upload.lib";
import { withNextQuestion } from "@/app/(main)/ai-builder/builder.lib";
import { withCard } from "@/app/(main)/ai-builder/builder-questions.lib";
import { loadOpenBuild, saveBuild } from "@/app/(main)/ai-builder/builder.store.server";

/**
 * Logo and product photos for the AI Store Builder (ROADMAP.md F-54c). Open only
 * after the seller confirms the brief. The type, size and limits are checked
 * before anything is stored, and files go under this seller's own folder, so
 * no path from the client is ever trusted.
 */

const burstLimiter = createRateLimiter({ limit: 30, windowMs: 60_000 });

const STATUS: Partial<Record<BuilderErrorCode, number>> = {
  unauthorized: 401,
  disabled: 404,
  tooLarge: 413,
  badFile: 415,
  rateLimited: 429,
  tooManyPhotos: 422,
  uploadsLocked: 403,
  notBuilding: 409,
  failed: 500,
};

const fail = (error: BuilderErrorCode) => NextResponse.json<BuilderChatResponse>({ ok: false, error }, { status: STATUS[error] ?? 422 });

const EXTENSION: Record<(typeof BUILDER_IMAGE_TYPES)[number], string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(request: NextRequest) {
  if (!builderEnabled()) return fail("disabled");
  if (Number(request.headers.get("content-length") ?? 0) > BUILDER_LIMITS.maxImageBytes + 64 * 1024) return fail("tooLarge");

  let sellerId: string;
  try {
    sellerId = (await requireSeller({ forWrite: true })).sellerId;
  } catch (error) {
    if (isAccessError(error)) return fail("unauthorized");
    throw error;
  }
  if (!burstLimiter.check(sellerId)) return fail("rateLimited");

  const build = await loadOpenBuild(sellerId);
  if (!build || build.status !== "collecting") return fail("notBuilding");
  // v1: after the brief card; v2: once the intake was read (the free claim comes at "Build and publish").
  if (build.state.flow === "v2" ? !build.state.intakeDone : !build.state.briefConfirmed) return fail("uploadsLocked");

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return fail("badFile");
  if (file.size === 0 || file.size > BUILDER_LIMITS.maxImageBytes) return fail(file.size ? "tooLarge" : "badFile");

  const target = form?.get("target");
  const productId = form?.get("productId");
  const product = typeof productId === "string" ? build.state.products.find((p) => p.id === productId) : undefined;
  if (target !== "logo" && !product) return fail("badFile");
  if (target !== "logo") {
    if (product!.photos.length >= BUILDER_LIMITS.photosPerProduct || build.state.photosUsed >= BUILDER_LIMITS.photos) return fail("tooManyPhotos");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  // By its bytes, not by what the browser says it is.
  const type = imageTypeOf(bytes);
  if (!type) return fail("badFile");

  const path = `ai-builder/${sellerId}/${build.id}/${randomUUID()}.${EXTENSION[type]}`;
  // The products bucket has no write policies (0153); the seller was checked above.
  const { error } = await getServiceClient().storage.from("products").upload(path, bytes, { contentType: type, cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("[ai-builder] upload failed", error.message);
    return fail("failed");
  }

  const state =
    target === "logo" && build.state.flow === "v2"
      ? withCard({ ...build.state, logo: path, logoDone: true })
      : target === "logo"
      ? withNextQuestion(withShortlist({ ...build.state, logo: path, logoDone: true, messages: [...build.state.messages, { role: "seller" as const, text: "chip:logo" }] }, build.id))
      : {
          ...build.state,
          photosUsed: build.state.photosUsed + 1,
          products: build.state.products.map((p) => (p.id === product!.id ? { ...p, photos: [...p.photos, path] } : p)),
        };
  await saveBuild(sellerId, build.id, { state });
  return NextResponse.json<BuilderChatResponse>({ ok: true, view: toView({ ...build, state }) });
}
