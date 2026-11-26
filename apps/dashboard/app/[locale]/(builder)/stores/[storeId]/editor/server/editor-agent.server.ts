"use server";

import { aiConfigured, aiErrorKind, checkDailyCap, generateStructured, logAiUsage, modelIdForTier } from "@workspace/ai";
import { and, db, eq, isNull, sellers, stores } from "@workspace/db";
import { currencyLabelText, parseStoreCurrency } from "@workspace/lib";
import { isProActive } from "@workspace/lib/billing";
import { claimAiCredit, refundAiCredit } from "@workspace/lib/billing/credits";
import { getBillingState } from "@workspace/lib/billing/server";
import { getStorePreviewProduct } from "@workspace/lib/store-sites/preview-product";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import type { EditorAdapter, EditorAgentTurnView } from "@workspace/store-editor";
import type { EditorErrorKey, EditorResult } from "@workspace/store-editor/editor.dto";
import { validatePageContent, type SectionInstance, type SiteLocale } from "@workspace/store-sections";
import { buildAgentContent, EDITOR_AGENT_FEATURE, editorAgentModelOutputSchema, runEditorAgentTurn } from "@workspace/store-sections/agent-server";
import { CODE_SERVER_CHECKS } from "@workspace/store-sections/code-server";
import { codePreviewQueries, prepareCodePreview, renderPreparedCodePreview } from "@workspace/store-sections/code-preview";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { loadCodePreviewCatalog, loadCodePreviewStore } from "./code-preview.data";
import { editorAgentInputSchema } from "./editor-agent.dto";

type EditorAgentTurnInput = Parameters<NonNullable<EditorAdapter["agent"]>["turn"]>[0];

/**
 * The website editor's AI agent (ROADMAP F-83c "Design agent in the editor",
 * F-101g/j "AI writes code sections"): one chat turn about a section or the
 * page. It returns validated ops the editor applies to its drafts; it writes
 * nothing to the database (drafts are saved and published by the normal,
 * fully validated paths).
 *
 * In order: the store belongs to the session seller and can be edited, AI is
 * set up, the burst limit, the input caps, the sent section validates (it is
 * the seller's unsaved draft, never trusted), the daily cap, then 1 AI credit
 * (F-57), claimed before the call and given back when no op applied (or the
 * answer came from the result cache). Code ops only while the `code_sections`
 * switch is on; otherwise the prompt doesn't offer them and they are refused.
 *
 * Cost (docs/ai.md): one `fast` call with thinking `minimal`, capped inputs
 * (`prompt.lib.ts`), no catalog in the prompt, a 10-minute result cache, and
 * one retry only when a code op fails its checks. Logs ids and counts only.
 */

/** A repeat of the same turn within this window is free (`generateStructured` cache). */
const RESULT_CACHE_MS = 10 * 60_000;
/** Code files can be long; three code ops of ~6 KB each fit. */
const MAX_OUTPUT_TOKENS = 12_000;
const PRO_DAILY_MULTIPLIER = 10;

/** Model calls a day (a turn makes 1, or 2 with the retry); ×10 on Pro. */
const dailyLimit = () => {
  const value = Number(process.env.AI_EDITOR_AGENT_DAILY_LIMIT);
  return Number.isInteger(value) && value >= 0 ? value : 60;
};

// Bursts per instance; the daily cap is the real, cross-instance limit.
const burstLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });

const fail = (error: EditorErrorKey): EditorResult<EditorAgentTurnView> => ({ success: false, error });

/** Stored image path or URL to a URL, as the editor canvas resolves it (same as the code preview). */
function imageUrl(path: string): string | null {
  if (!path) return null;
  if (/^(https?:)?\/\//.test(path)) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sellers/${path}`;
}

async function loadStoreLocales(sellerId: string, storeId: string): Promise<{ defaultLocale: SiteLocale; locales: SiteLocale[] } | null> {
  const [row] = await db
    .select({ defaultLocale: stores.defaultLocale, supportedLocales: stores.supportedLocales })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .limit(1);
  if (!row) return null;
  const known = (v: string): v is SiteLocale => v === "ar" || v === "en";
  const locales = (row.supportedLocales ?? []).filter(known);
  const defaultLocale = known(row.defaultLocale) ? row.defaultLocale : "ar";
  return { defaultLocale, locales: locales.length ? locales : [defaultLocale] };
}

export async function editorAgentTurn(storeId: string, input: EditorAgentTurnInput): Promise<EditorResult<EditorAgentTurnView>> {
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

  let creditReference: string | null = null;
  const giveBack = async () => {
    if (creditReference) await refundAiCredit(sellerId, creditReference).catch(() => {});
    creditReference = null;
  };

  try {
    // The platform kill switch (F-83c): a missing row means off.
    if (!(await isSwitchOn("editor_agent").catch(() => false))) return fail("notFound");
    if (!aiConfigured()) return fail("aiUnavailable");
    if (!burstLimiter.check(`agent:${sellerId}`)) return fail("rateLimited");
    const parsed = editorAgentInputSchema.safeParse(input);
    if (!parsed.success) return fail("invalidInput");
    const turn = parsed.data;

    const [allowCode, row, locales] = await Promise.all([
      isSwitchOn("code_sections").catch(() => false),
      loadCodePreviewStore(sellerId, ownStoreId, turn.pageId),
      loadStoreLocales(sellerId, ownStoreId),
    ]);
    if (!row || !locales) return fail("notFound");

    // The seller's own unsaved draft: validated exactly like a draft save before anything reads it.
    let section: SectionInstance | null = null;
    if (turn.section !== undefined) {
      const checked = validatePageContent({ sections: [turn.section] }, { serverChecks: CODE_SERVER_CHECKS });
      if (!checked.success) return fail("invalidContent");
      section = checked.data.sections[0] ?? null;
    }
    const content = buildAgentContent({ target: turn.target, section, outlineIds: turn.outline.map((s) => s.id) });
    if (!content) return fail("invalidInput");

    const billing = await getBillingState().catch(() => null);
    if (!billing) return fail("generic");
    const planRow = billing.usdLive
      ? (await db.select({ plan: sellers.plan, planExpiresAt: sellers.planExpiresAt, planGraceUntil: sellers.planGraceUntil }).from(sellers).where(eq(sellers.id, sellerId)))[0]
      : null;
    const limit = planRow && isProActive(planRow) ? dailyLimit() * PRO_DAILY_MULTIPLIER : dailyLimit();
    // Fails closed: without the usage table there is no cap, so no AI.
    const cap = await checkDailyCap(sellerId, EDITOR_AGENT_FEATURE, limit).catch((error: unknown) => {
      console.error("[ai] daily cap check failed", error instanceof Error ? error.message : error);
      return null;
    });
    if (!cap) return fail("generic");
    if (!cap.allowed) {
      await logAiUsage({ sellerId, feature: EDITOR_AGENT_FEATURE, model: modelIdForTier("fast"), status: "blocked", errorCode: "daily_limit", refId: ownStoreId });
      return fail("aiDailyLimit");
    }

    if (billing.usdLive) {
      const claim = await claimAiCredit(sellerId, EDITOR_AGENT_FEATURE).catch((error: unknown) => {
        console.error("[ai] credit claim failed", error instanceof Error ? error.message : error);
        return null;
      });
      if (!claim) return fail("generic");
      if (!claim.ok) {
        await logAiUsage({ sellerId, feature: EDITOR_AGENT_FEATURE, model: modelIdForTier("fast"), status: "blocked", errorCode: "no_credits", refId: ownStoreId });
        return fail("aiNoCredits");
      }
      creditReference = claim.reference;
    }

    let calls = 0;
    let cachedCalls = 0;
    let result: Awaited<ReturnType<typeof runEditorAgentTurn>>;
    try {
      result = await runEditorAgentTurn(
        {
          message: turn.message,
          uiLocale: turn.uiLocale,
          contentLocale: turn.contentLocale,
          target: turn.target,
          section,
          outline: turn.outline,
          history: turn.history,
          store: { name: row.name, defaultLocale: locales.defaultLocale, locales: locales.locales, colors: asRecord(row.colors), typography: asRecord(row.typography) },
          allowCode,
          content,
          maxModelCalls: cap.remaining,
        },
        {
          callModel: async ({ system, text }) => {
            calls += 1;
            const { object, cached } = await generateStructured({
              feature: EDITOR_AGENT_FEATURE,
              refId: ownStoreId,
              sellerId,
              tier: "fast",
              schema: editorAgentModelOutputSchema,
              system,
              content: [{ type: "text", text }],
              thinkingLevel: "minimal",
              maxOutputTokens: MAX_OUTPUT_TOKENS,
              cacheMs: RESULT_CACHE_MS,
            });
            if (cached) cachedCalls += 1;
            return object;
          },
        },
      );
    } catch (error) {
      await giveBack();
      // The usage rows (with the error codes) are written by generateStructured.
      console.error("[editor-agent] model call failed", { storeId: ownStoreId, kind: aiErrorKind(error) });
      return fail("aiFailed");
    }

    // A turn that changed nothing, or came back from the cache, is free.
    if (result.applied.length === 0 || cachedCalls === calls) await giveBack();
    const creditsUsed = creditReference ? 1 : 0;

    const previews = result.codeNodes.length
      ? await renderPreviews(sellerId, ownStoreId, row, turn.contentLocale, locales.defaultLocale, result.codeNodes).catch(() => ({}))
      : {};

    console.info("[editor-agent] turn", {
      storeId: ownStoreId,
      applied: result.applied.length,
      rejected: result.rejected.length,
      calls,
      retried: result.retried,
      code: allowCode,
    });
    return {
      success: true,
      data: {
        reply: result.reply,
        ops: result.ops,
        applied: result.summary,
        rejected: result.rejected.map(({ index, code }) => ({ index, code })),
        previews,
        creditsUsed,
      },
    };
  } catch (error) {
    await giveBack();
    if (isAccessError(error)) return fail(error.code === "store_read_only" ? "readOnly" : "notFound");
    // Ids only: never the request, the section or the code.
    console.error("[editor-agent] failed", { storeId: ownStoreId });
    return fail("generic");
  }
}

type StoreRow = NonNullable<Awaited<ReturnType<typeof loadCodePreviewStore>>>;

/** The canvas previews of the code elements a turn wrote, through the same path as the Code tab's preview. Never cached. */
async function renderPreviews(
  sellerId: string,
  storeId: string,
  row: StoreRow,
  locale: SiteLocale,
  defaultLocale: SiteLocale,
  nodes: Awaited<ReturnType<typeof runEditorAgentTurn>>["codeNodes"],
): Promise<EditorAgentTurnView["previews"]> {
  const pageType = row.pageKind === "product" ? "product" : "page";
  const [product, customDomain] = await Promise.all([
    pageType === "product" ? getStorePreviewProduct(sellerId, storeId, undefined, { locale }).catch(() => null) : null,
    findActiveCustomDomainForSubdomain(row.subdomain).catch(() => null),
  ]);
  const { currency, label } = parseStoreCurrency(row.settings);
  const out: EditorAgentTurnView["previews"] = {};
  await Promise.all(
    nodes.map(async (node) => {
      const prepared = prepareCodePreview({ nodeId: node.nodeId, file: node.file, name: node.props.name, settings: node.props.settings, blocks: node.props.blocks });
      const catalog = await loadCodePreviewCatalog(sellerId, storeId, codePreviewQueries(prepared), locale);
      const rendered = renderPreparedCodePreview(prepared, node.file, {
        locale,
        pageType,
        storeId,
        store: { name: row.name, url: storeUrl(row.subdomain, customDomain), logoUrl: row.logoUrl },
        currency,
        currencyLabel: currencyLabelText(label, locale),
        // Liquid's URLs follow the storefront's language rule for this store (as the Code tab's preview).
        defaultLocale,
        designSystem: { colors: row.colors, typography: row.typography, spacing: row.spacing },
        catalog,
        product,
        imageUrl,
      });
      out[node.nodeId] = { html: rendered.html, css: rendered.css, props: rendered.props as unknown as Record<string, unknown> };
    }),
  );
  return out;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}
