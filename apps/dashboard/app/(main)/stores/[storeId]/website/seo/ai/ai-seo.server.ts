"use server";

import { aiConfigured, aiErrorKind, checkDailyCap, generateStructured, logAiUsage, modelIdForTier } from "@workspace/ai";
import { and, db, eq, sellers, storePages } from "@workspace/db";
import { isProActive } from "@workspace/lib/billing";
import { claimAiCredit, getAiCreditStatus, refundAiCredit } from "@workspace/lib/billing/credits";
import { getBillingState } from "@workspace/lib/billing/server";
import { storeCategoryFor } from "@workspace/lib/stores";
import { getStore } from "@workspace/lib/stores/server";
import { storeCategoryGroups } from "@workspace/lib/store-sites/catalog-data";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { AI_SEO_FEATURE, AI_SEO_LIMITS, aiSeoOutputSchema, type AiSeoErrorCode, type AiSeoResult, type AiSeoTarget } from "./ai-seo.dto";
import { AI_SEO_SYSTEM_RULES, aiSeoRequestText, capAiSeoInput, cleanAiSeoOutput, pageTextExcerpt } from "./ai-seo.lib";

/**
 * "Write with AI" on Website › SEO (owner, 2026-11-09). Writes the SEO title,
 * description and keywords of the store or of one of its pages and returns
 * them for the form; never saves. 1 AI credit per call, given back when the
 * call fails or the answer came from the result cache. Cost rules: docs/ai.md.
 */

/** The same store/page asked again within this window gets the stored answer, free. */
const RESULT_CACHE_MS = 10 * 60_000;
const PRO_DAILY_MULTIPLIER = 10;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Bursts per instance; the daily cap below is the real, cross-instance limit.
const burstLimiter = createRateLimiter({ limit: 6, windowMs: 60_000 });

const dailyLimit = () => {
  const value = Number(process.env.AI_SEO_DAILY_LIMIT);
  return Number.isInteger(value) && value >= 0 ? value : 30;
};

const fail = (error: AiSeoErrorCode): AiSeoResult => ({ ok: false, error });

export async function writeSeoWithAi(storeId: string, target: AiSeoTarget): Promise<AiSeoResult> {
  // The store comes from the session seller; requireStore refuses a foreign or read-only one.
  let sellerId: string;
  try {
    sellerId = (await requireStore(String(storeId ?? ""), { forWrite: true })).seller.sellerId;
  } catch (error) {
    if (!isAccessError(error)) throw error;
    return fail(error.code === "store_read_only" ? "readOnly" : "notFound");
  }
  const store = await getStore(sellerId, String(storeId));
  if (!store) return fail("notFound");

  const kind = target?.kind === "page" ? "page" : "store";
  let page: { name: unknown; draftContent: unknown } | null = null;
  if (kind === "page") {
    const pageId = target.kind === "page" ? String(target.pageId ?? "") : "";
    if (!UUID_RE.test(pageId)) return fail("notFound");
    // The page must belong to this (owned) store.
    [page = null] = await db
      .select({ name: storePages.name, draftContent: storePages.draftContent })
      .from(storePages)
      .where(and(eq(storePages.id, pageId), eq(storePages.storeId, store.id)))
      .limit(1);
    if (!page) return fail("notFound");
  }

  if (!aiConfigured()) return fail("disabled");
  if (!burstLimiter.check(sellerId)) return fail("rateLimited");

  const billing = await getBillingState().catch(() => null);
  if (!billing) return fail("failed");
  const planRow = billing.usdLive
    ? (await db.select({ plan: sellers.plan, planExpiresAt: sellers.planExpiresAt, planGraceUntil: sellers.planGraceUntil }).from(sellers).where(eq(sellers.id, sellerId)))[0]
    : null;
  const limit = planRow && isProActive(planRow) ? dailyLimit() * PRO_DAILY_MULTIPLIER : dailyLimit();
  // Fails closed: without the usage table there is no cap, so no AI.
  const cap = await checkDailyCap(sellerId, AI_SEO_FEATURE, limit).catch((error: unknown) => {
    console.error("[ai] daily cap check failed", error instanceof Error ? error.message : error);
    return null;
  });
  if (!cap) return fail("failed");
  if (!cap.allowed) {
    await logAiUsage({ sellerId, feature: AI_SEO_FEATURE, model: modelIdForTier("fast"), status: "blocked", errorCode: "daily_limit" });
    return fail("dailyLimit");
  }

  // The code picks a few of the store's own categories: never a catalog list (docs/ai.md rule 2).
  const language = store.defaultLocale === "en" ? "en" : "ar";
  const groups = await storeCategoryGroups(sellerId, store.catalogMode === "selected" ? store.id : undefined).catch(() => []);
  const categories = [...groups]
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, AI_SEO_LIMITS.categories)
    .map((g) => (language === "ar" ? g.nameAr || g.name : g.name || g.nameAr));
  const pageName = (page?.name ?? {}) as { ar?: string; en?: string };
  const input = capAiSeoInput({
    language,
    target: kind,
    storeName: store.name,
    storeDescription: store.description,
    storeCategory: storeCategoryFor(language, store.storeCategory, store.storeCategoryAr),
    categories,
    pageName: language === "ar" ? pageName.ar || pageName.en : pageName.en || pageName.ar,
    pageText: page ? pageTextExcerpt(page.draftContent) : "",
  });

  // Credits (F-57): take one before the call, give it back if it fails or was cached.
  let creditReference: string | null = null;
  if (billing.usdLive) {
    const claim = await claimAiCredit(sellerId, AI_SEO_FEATURE).catch((error: unknown) => {
      console.error("[ai] credit claim failed", error instanceof Error ? error.message : error);
      return null;
    });
    if (!claim) return fail("failed");
    if (!claim.ok) {
      await logAiUsage({ sellerId, feature: AI_SEO_FEATURE, model: modelIdForTier("fast"), status: "blocked", errorCode: "no_credits" });
      return fail("noCredits");
    }
    creditReference = claim.reference;
  }
  const giveBack = async () => {
    if (creditReference) await refundAiCredit(sellerId, creditReference).catch(() => {});
  };

  try {
    const { object, cached } = await generateStructured({
      feature: AI_SEO_FEATURE,
      refId: store.id,
      sellerId,
      tier: "fast",
      schema: aiSeoOutputSchema,
      system: AI_SEO_SYSTEM_RULES,
      content: [{ type: "text", text: aiSeoRequestText(input) }],
      thinkingLevel: "minimal",
      // Three short fields; caps a runaway answer.
      maxOutputTokens: 400,
      cacheMs: RESULT_CACHE_MS,
    });
    const result = cleanAiSeoOutput(object, input);
    // Nothing usable means the seller got nothing for the credit.
    if (cached || (!result.title && !result.description)) await giveBack();
    if (!result.title && !result.description) return fail("failed");
    const credits = billing.usdLive ? await getAiCreditStatus(sellerId).catch(() => null) : null;
    return { ok: true, ...result, ...(credits && { creditsRemaining: credits.total }) };
  } catch (error) {
    await giveBack();
    // The usage rows (with the error codes) are written by generateStructured.
    console.error("[ai] seo write failed", error instanceof Error ? error.message : error);
    return fail(aiErrorKind(error));
  }
}
