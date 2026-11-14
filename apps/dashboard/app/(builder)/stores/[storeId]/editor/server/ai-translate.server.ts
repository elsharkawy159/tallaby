"use server";

import {
  aiConfigured,
  aiErrorKind,
  checkDailyCap,
  createResultCache,
  generateStructured,
  logAiUsage,
  modelIdForTier,
  resultCacheKey,
} from "@workspace/ai";
import { db, eq, sellers } from "@workspace/db";
import { isProActive } from "@workspace/lib/billing";
import { claimAiCredit, getAiCreditStatus, refundAiCredit } from "@workspace/lib/billing/credits";
import { getBillingState } from "@workspace/lib/billing/server";
import {
  runSiteAiTranslation,
  SITE_TRANSLATE_FEATURE,
  SITE_TRANSLATE_SYSTEM_RULES,
  siteTranslateMaxOutputTokens,
  siteTranslateOutputSchema,
  type TranslationMemory,
} from "@workspace/lib/store-sites/ai-translate";
import { applyStoreSiteAiTranslations, collectStoreSiteUntranslated } from "@workspace/lib/store-sites/server";
import type { AiTranslateSummary, EditorErrorKey, EditorResult } from "@workspace/store-editor/editor.dto";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Builder › More › Fill missing translations, the AI step (after the free
 * template fill, and only when the seller confirms its cost): translates the
 * text the seller wrote that still has no other language, and writes it into
 * the EMPTY language of the drafts only. The seller reviews and publishes.
 *
 * Cost (docs/ai.md): the code finds, dedupes and skips what needs no model
 * (`ai-translate.ts`), a translation memory answers text seen before in any
 * store for free, the rest goes in capped batches (200 texts, 10,000
 * characters a run) to the `fast` tier with thinking `minimal`. 1 AI credit
 * per run that calls the model, given back when nothing usable came back;
 * the daily cap counts model calls.
 */

/** A retry of the same batch within this window is free (`generateStructured` cache). */
const RESULT_CACHE_MS = 10 * 60_000;
/** The translation memory: (from, to, text) → checked translation, shared by every store on this instance. */
const MEMORY_TTL_MS = 7 * 24 * 60 * 60_000;
const memoryCache = createResultCache(5_000);
const memoryKey = (from: string, to: string, text: string) => resultCacheKey([`${SITE_TRANSLATE_FEATURE}@1`, from, to, text]);
const memory: TranslationMemory = {
  get: (from, to, text) => memoryCache.read<string>(memoryKey(from, to, text)),
  set: (from, to, text, translation) => memoryCache.write(memoryKey(from, to, text), translation, MEMORY_TTL_MS),
};

const PRO_DAILY_MULTIPLIER = 10;
/** Model calls a day; a run makes 1 to 4. */
const dailyLimit = () => {
  const value = Number(process.env.AI_SITE_TRANSLATE_DAILY_LIMIT);
  return Number.isInteger(value) && value >= 0 ? value : 20;
};

// Bursts per instance; the daily cap is the real, cross-instance limit.
const burstLimiter = createRateLimiter({ limit: 4, windowMs: 60_000 });

const fail = (error: EditorErrorKey): EditorResult<AiTranslateSummary> => ({ success: false, error });

export async function translateSiteWithAi(storeId: string): Promise<EditorResult<AiTranslateSummary>> {
  // The store comes from the session seller; requireStore refuses a foreign or read-only one.
  let sellerId: string;
  let ownStoreId: string;
  try {
    const access = await requireStore(String(storeId ?? ""), { forWrite: true });
    sellerId = access.seller.sellerId;
    ownStoreId = access.store.id;
  } catch (error) {
    if (!isAccessError(error)) throw error;
    return fail(error.code === "store_read_only" ? "readOnly" : "notFound");
  }

  if (!aiConfigured()) return fail("aiUnavailable");
  if (!burstLimiter.check(sellerId)) return fail("rateLimited");

  const collected = await collectStoreSiteUntranslated(sellerId, ownStoreId);
  if (!collected.success) return fail(collected.error === "store_read_only" ? "readOnly" : "notFound");
  const { defaultLocale: from, storeName, texts } = collected.data;
  const to = from === "ar" ? "en" : "ar";
  if (!texts.length) return { success: true, data: { translated: 0, applied: 0, left: 0, creditsRemaining: null } };

  const billing = await getBillingState().catch(() => null);
  if (!billing) return fail("generic");
  const planRow = billing.usdLive
    ? (await db.select({ plan: sellers.plan, planExpiresAt: sellers.planExpiresAt, planGraceUntil: sellers.planGraceUntil }).from(sellers).where(eq(sellers.id, sellerId)))[0]
    : null;
  const limit = planRow && isProActive(planRow) ? dailyLimit() * PRO_DAILY_MULTIPLIER : dailyLimit();
  // Fails closed: without the usage table there is no cap, so no AI.
  const cap = await checkDailyCap(sellerId, SITE_TRANSLATE_FEATURE, limit).catch((error: unknown) => {
    console.error("[ai] daily cap check failed", error instanceof Error ? error.message : error);
    return null;
  });
  if (!cap) return fail("generic");

  // Credits (F-57): one per run, taken just before the first model call (none when memory knows it all).
  let creditReference: string | null = null;
  let stoppedBy: AiTranslateSummary["stoppedBy"];
  const beforeAi = async () => {
    if (!billing.usdLive) return true;
    const claim = await claimAiCredit(sellerId, SITE_TRANSLATE_FEATURE).catch((error: unknown) => {
      console.error("[ai] credit claim failed", error instanceof Error ? error.message : error);
      return null;
    });
    if (!claim) return false;
    if (!claim.ok) {
      stoppedBy = "aiNoCredits";
      await logAiUsage({ sellerId, feature: SITE_TRANSLATE_FEATURE, model: modelIdForTier("fast"), status: "blocked", errorCode: "no_credits", refId: ownStoreId });
      return false;
    }
    creditReference = claim.reference;
    return true;
  };
  const giveBack = async () => {
    if (creditReference) await refundAiCredit(sellerId, creditReference).catch(() => {});
    creditReference = null;
  };

  let calls = 0;
  let cachedCalls = 0;
  const run = await runSiteAiTranslation({
    texts,
    from,
    to,
    storeName,
    maxCalls: cap.remaining,
    memory,
    beforeAi,
    translateBatch: async (request, batch) => {
      calls += 1;
      const { object, cached } = await generateStructured({
        feature: SITE_TRANSLATE_FEATURE,
        refId: ownStoreId,
        sellerId,
        tier: "fast",
        schema: siteTranslateOutputSchema,
        system: SITE_TRANSLATE_SYSTEM_RULES,
        content: [{ type: "text", text: request.text }],
        thinkingLevel: "minimal",
        maxOutputTokens: siteTranslateMaxOutputTokens(batch),
        cacheMs: RESULT_CACHE_MS,
      });
      if (cached) cachedCalls += 1;
      return object;
    },
  });
  if (!cap.allowed || run.overCalls > 0) {
    stoppedBy ??= "aiDailyLimit";
    if (!cap.allowed) await logAiUsage({ sellerId, feature: SITE_TRANSLATE_FEATURE, model: modelIdForTier("fast"), status: "blocked", errorCode: "daily_limit", refId: ownStoreId });
  }

  // Nothing new from the model (every call failed, was cached or was rejected): the run is free.
  if (run.fromAi === 0 || (calls > 0 && cachedCalls === calls)) await giveBack();

  if (!run.translations.size) {
    if (run.refused) return fail(stoppedBy === "aiNoCredits" ? "aiNoCredits" : "generic");
    if (stoppedBy === "aiDailyLimit") return fail("aiDailyLimit");
    if (run.error) {
      // The usage rows (with the error codes) are written by generateStructured.
      console.error("[ai] site translate failed", aiErrorKind(run.error));
      return fail("aiFailed");
    }
    return { success: true, data: { translated: 0, applied: 0, left: run.left, creditsRemaining: null } };
  }

  const applied = await applyStoreSiteAiTranslations(sellerId, ownStoreId, from, run.translations).catch((error: unknown) => {
    console.error("[store-editor] ai translations not saved", error instanceof Error ? error.message : error);
    return null;
  });
  if (!applied || !applied.success) {
    await giveBack();
    if (applied?.error === "store_read_only") return fail("readOnly");
    if (applied?.error === "locale_changed") return fail("versionConflict");
    return fail(applied ? "notFound" : "generic");
  }
  const credits = billing.usdLive ? await getAiCreditStatus(sellerId).catch(() => null) : null;
  return {
    success: true,
    data: {
      translated: run.translations.size,
      applied: applied.data.applied,
      left: run.left,
      ...(stoppedBy && { stoppedBy }),
      creditsRemaining: credits ? credits.total : null,
    },
  };
}
