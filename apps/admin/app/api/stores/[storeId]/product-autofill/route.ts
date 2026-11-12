import { NextResponse, type NextRequest } from "next/server";
import { aiConfigured, aiErrorKind, logAiUsage, modelIdForTier } from "@workspace/ai";
import { agentSearchCategories } from "@workspace/lib/products/agent/server";
import {
  AUTOFILL_LIMITS,
  validateAutofillInput,
  type AutofillErrorCode,
  type AutofillFile,
  type ProductAutofillOutput,
} from "@workspace/lib/products/autofill";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import {
  StoreProductsAccessError,
  requireStoreProductsAccess,
} from "@/app/(dashboard)/stores/[storeId]/products/store-products-access.server";
import { adminAutofillProduct, adminAutofillUsedToday, adminDailyLimit } from "@/app/(dashboard)/stores/[storeId]/products/store-autofill.server";
import { ADMIN_AUTOFILL_FEATURE } from "@/app/(dashboard)/stores/[storeId]/products/store-products.lib";

/**
 * Admin › Store › Products › Fill with AI: photos and/or text → form values
 * for a product in this store. Never saves. Same limits, prompt and model
 * settings as the seller's autofill; the seller's credits and daily cap are
 * not touched (see store-autofill.server.ts).
 */

export const maxDuration = 60;

export type AdminAutofillResponse =
  | {
      ok: true;
      output: ProductAutofillOutput;
      /** The Tallaby category matched in code from the model's hint (no list in the prompt). */
      category: { id: string; name: string | null; nameAr: string | null } | null;
      remainingToday: number;
    }
  | { ok: false; error: AutofillErrorCode };

const STATUS: Record<AutofillErrorCode, number> = {
  unauthorized: 401,
  disabled: 503,
  empty: 400,
  tooLarge: 413,
  pdfTooLong: 413,
  badFile: 415,
  rateLimited: 429,
  dailyLimit: 429,
  noCredits: 402,
  busy: 503,
  timeout: 504,
  failed: 502,
};

const fail = (error: AutofillErrorCode) => NextResponse.json<AdminAutofillResponse>({ ok: false, error }, { status: STATUS[error] });

const burstLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

async function readFile(value: FormDataEntryValue): Promise<AutofillFile | null> {
  if (typeof value === "string") return null;
  return { mediaType: value.type, size: value.size, data: new Uint8Array(await value.arrayBuffer()) };
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await ctx.params;
  let access;
  try {
    access = await requireStoreProductsAccess(storeId, { forWrite: true });
  } catch (error) {
    if (error instanceof StoreProductsAccessError) return fail("unauthorized");
    throw error;
  }
  if (!aiConfigured()) return fail("disabled");

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > AUTOFILL_LIMITS.maxTotalBytes + 64 * 1024) return fail("tooLarge");

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail("badFile");
  }
  const text = typeof form.get("text") === "string" ? (form.get("text") as string) : "";
  const images = (await Promise.all(form.getAll("images").map(readFile))).filter((f): f is AutofillFile => f !== null);
  const input = { text, images, pdf: null, current: null };
  const invalid = validateAutofillInput(input);
  if (invalid) return fail(invalid);

  if (!burstLimiter.check(access.adminId)) return fail("rateLimited");
  const limit = adminDailyLimit();
  const used = await adminAutofillUsedToday(access.adminId).catch(() => null);
  // Fails closed, like the seller route: no cap reading, no AI.
  if (used === null) return fail("failed");
  if (used >= limit) {
    await logAiUsage({
      sellerId: access.store.sellerId,
      feature: ADMIN_AUTOFILL_FEATURE,
      refId: access.adminId,
      model: modelIdForTier("fast"),
      status: "blocked",
      errorCode: "daily_limit",
    });
    return fail("dailyLimit");
  }

  try {
    const { output, cached } = await adminAutofillProduct(access, input);
    // The model's English hint, then its last word ("running shoes" → "shoes"), matched in code.
    const hint = (output.categoryHint || output.localized.en.title).trim();
    const words = hint.split(/\s+/).filter((w) => w.length > 2);
    let match: Awaited<ReturnType<typeof agentSearchCategories>>[number] | undefined;
    for (const term of [...new Set([hint, words.at(-1) ?? ""])].filter(Boolean)) {
      [match] = await agentSearchCategories(access.ctx, term.slice(0, 80)).catch(() => []);
      if (match) break;
    }
    return NextResponse.json<AdminAutofillResponse>({
      ok: true,
      output,
      category: match ? { id: match.id, name: match.name, nameAr: match.nameAr } : null,
      remainingToday: Math.max(0, limit - used - (cached ? 0 : 1)),
    });
  } catch (error) {
    console.error("[admin-ai] store product autofill failed", error instanceof Error ? error.message : error);
    return fail(aiErrorKind(error));
  }
}
