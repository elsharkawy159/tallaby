"use server";

import { aiConfigured, aiErrorKind, checkDailyCap, generateStructured, logAiUsage, modelIdForTier } from "@workspace/ai";
import { db, eq, sellers } from "@workspace/db";
import { parseStoreCurrency } from "@workspace/lib";
import { isProActive } from "@workspace/lib/billing";
import { claimAiCredit, getAiCreditStatus, refundAiCredit } from "@workspace/lib/billing/credits";
import { getBillingState } from "@workspace/lib/billing/server";
import { getStoreForEditor } from "@workspace/lib/store-sites/server";
import { validatePageContent, type SectionInstance, type SiteLocale } from "@workspace/store-sections";
import {
  cleanAgentReply,
  cleanAgentSuggestions,
  editorAgentModelOutputWithSuggestionsSchema,
  runEditorAgentTurn,
  serializeSiteOutline,
  siteOutline,
  siteOutlineEntry,
  type EditorAgentImage,
  type SiteOutlineEntry,
} from "@workspace/store-sections/agent-server";
import { CODE_SERVER_CHECKS } from "@workspace/store-sections/code-server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { mediaImageCheck, mediaPathsIn, ownMediaImages, type AgentMediaImage } from "../../server/agent-images.server";
import { renderAgentCodePreviews } from "../../server/agent-previews.server";
import { loadCodePreviewStore } from "../../server/code-preview.data";
import {
  actionIdSchema,
  editWithAiInputSchema,
  editWithAiUploadsInputSchema,
  type EditWithAiCard,
  type EditWithAiConfirmView,
  type EditWithAiError,
  type EditWithAiInput,
  type EditWithAiResult,
  type EditWithAiRoute,
  type EditWithAiTargetInput,
  type EditWithAiTurnView,
  type EditWithAiUpload,
  type EditWithAiUploadsInput,
} from "./edit-with-ai.dto";
import {
  EDIT_WITH_AI_ADVICE_SYSTEM,
  EDIT_WITH_AI_FEATURE,
  EDIT_WITH_AI_ROUTER_SYSTEM,
  editWithAiAdviceSchema,
  editWithAiAdviceText,
  editWithAiRouterSchema,
  editWithAiRouterText,
  MAX_ADVICE_REPLY_LENGTH,
  outOfReach,
  pageFacts,
  pickTargetByCode,
  routeByCode,
  scopeByCode,
  wantsPublish,
  type CodeTarget,
  type EditWithAiPageContext,
} from "./edit-with-ai.lib";
import { agentErrorKey, editWithAiContext, editWithAiRuntime, pendingPublishes, runStoreAgentTurn, storeTurnSummary, toProposalView } from "./edit-with-ai-agent.server";
import { signEditWithAiFileLink, signEditWithAiUploads, verifyEditWithAiAttachments } from "./edit-with-ai-files.server";

/**
 * "Edit with AI" (owner request 2026-11-26): the chat of the website editor's
 * AI layout. One turn can change the site's DRAFTS (it returns validated ops
 * that the editor applies to its own drafts as one undo step; this action
 * writes nothing, and autosave saves them through the normal validated draft
 * save), propose store changes (products, settings, shipping, theme) as
 * confirm cards of the agent core, or turn an attached products file into a
 * card that opens the existing from-file import. Nothing is published: the
 * seller's Publish button calls the editor's existing `publish` action.
 *
 * A site turn reads the SAVED drafts: the editor saves its pending edits
 * before every turn, so they are what the canvas shows. The page and the
 * selected section come from the client as ids only and must exist in those
 * drafts.
 *
 * Order of checks: the store is the session seller's and writable, the
 * `editor_agent` switch, AI is set up, a burst limit, the input caps and the
 * attachments (uploaded, this seller's and store's, real type), the daily
 * cap, then 1 AI credit for a site turn (claimed before the edit call, given
 * back when no op applied or the answer came from the result cache).
 * Store-data turns cost nothing here: the core charges 1 credit when the
 * seller confirms a card. Logs ids and counts only.
 *
 * Cost (docs/ai.md): code routes, picks the section and tells a page-wide
 * request when it can; else one `fast`, thinking-minimal router call on a
 * capped outline; then the editor agent's one `fast` call (one retry only
 * for a failed code op). A page-wide request shows the model the page's tree
 * sections within `MAX_PAGE_PROMPT_BYTES`, still in that one call.
 *
 * Two answers change nothing and cost no credit: "advice" (a question about
 * the website: one `fast` call on the capped outline and facts counted by
 * code; it counts toward the daily cap) and "help" (something this chat
 * can't do: code answers with a link to the page that does it, no model).
 */

const RESULT_CACHE_MS = 10 * 60_000;
const MAX_OUTPUT_TOKENS = 12_000;
const ROUTER_OUTPUT_TOKENS = 300;
/** An advice answer is at most 900 characters and 3 short suggestions. */
const ADVICE_OUTPUT_TOKENS = 1000;
const PRO_DAILY_MULTIPLIER = 10;

/** Model calls a day for this feature (router + edit); ×10 on Pro. */
const dailyLimit = () => {
  const value = Number(process.env.AI_EDIT_WITH_AI_DAILY_LIMIT);
  return Number.isInteger(value) && value >= 0 ? value : 60;
};

// Bursts per instance; the daily cap is the real, cross-instance limit.
const turnLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
const actionLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

const fail = <T>(error: EditWithAiError): EditWithAiResult<T> => ({ success: false, error });

type Access = { sellerId: string; storeId: string; userId: string; storeName: string };

async function access(storeId: unknown): Promise<Access | EditWithAiError> {
  try {
    const found = await requireStore(String(storeId ?? ""), { forWrite: true });
    return { sellerId: found.seller.sellerId, storeId: found.store.id, userId: found.seller.userId, storeName: found.store.name };
  } catch (error) {
    if (!isAccessError(error)) throw error;
    return error.code === "store_read_only" ? "readOnly" : "notFound";
  }
}

/** The platform kill switch (F-83c): a missing row means off. */
const switchOn = () => isSwitchOn("editor_agent").catch(() => false);

function emptyView(route: EditWithAiRoute, reply: string): EditWithAiTurnView {
  return { reply, route, siteChanges: null, proposals: [], cards: [], suggestions: [], links: [], rejected: [], creditsUsed: 0, creditsRemaining: null };
}

/** The seller's AI credits now, read after the turn's claim or refund settled. Never cached; null before the USD switch or when the read fails. */
async function creditsLeft(sellerId: string, usdLive: boolean): Promise<number | null> {
  if (!usdLive) return null;
  return getAiCreditStatus(sellerId)
    .then((status) => status.total)
    .catch(() => null);
}

const REPLIES = {
  import: { ar: "جهزت لك ملف المنتجات. اضغط على البطاقة عشان تراجع المنتجات قبل ما تضيفها.", en: "Your products file is ready. Open the card to review the products before adding them." },
  noTarget: { ar: "مش لاقي الجزء ده في الموقع. قولّي اسم القسم أو مكانه.", en: "I couldn't find that part of the site. Tell me the section's name or where it is." },
  none: { ar: "قولّي تحب تغيّر إيه في موقعك أو منتجاتك.", en: "Tell me what you'd like to change on your site or products." },
  help: { ar: "ده مش بيتعمل من المحادثة دي. هتلاقيه في الصفحة دي من لوحة التحكم:", en: "I can't do that from this chat. You'll find it on this page of your dashboard:" },
} as const;

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

/**
 * Signed uploads for the turn's attachments: photos into the store's media
 * library, products files into the private files bucket. The paths are made
 * here for the session's seller and store; the browser can't choose them.
 */
export async function createEditWithAiUploads(storeId: string, input: EditWithAiUploadsInput): Promise<EditWithAiResult<EditWithAiUpload[]>> {
  const who = await access(storeId);
  if (typeof who === "string") return fail(who);
  try {
    if (!(await switchOn())) return fail("notFound");
    if (!actionLimiter.check(`edit-ai-upload:${who.sellerId}`)) return fail("rateLimited");
    const parsed = editWithAiUploadsInputSchema.safeParse(input);
    if (!parsed.success) return fail("invalidInput");
    const signed = await signEditWithAiUploads(who.sellerId, who.storeId, parsed.data.files);
    if (!signed.ok) return fail(signed.error === "unavailable" ? "uploadUnavailable" : "attachmentInvalid");
    return { success: true, data: signed.uploads };
  } catch {
    console.error("[edit-with-ai] uploads failed", { storeId: who.storeId });
    return fail("generic");
  }
}

/** The from-file import's bridge: a short-lived link to the seller's own attached products file. */
export async function editWithAiImportFile(storeId: string, fileRef: string): Promise<EditWithAiResult<{ url: string; name: string; type: string }>> {
  const who = await access(storeId);
  if (typeof who === "string") return fail(who);
  try {
    if (!(await switchOn())) return fail("notFound");
    if (!actionLimiter.check(`edit-ai-file:${who.sellerId}`)) return fail("rateLimited");
    const link = await signEditWithAiFileLink(who.sellerId, who.storeId, String(fileRef ?? ""));
    return link ? { success: true, data: link } : fail("notFound");
  } catch {
    console.error("[edit-with-ai] file link failed", { storeId: who.storeId });
    return fail("generic");
  }
}

// ---------------------------------------------------------------------------
// The turn
// ---------------------------------------------------------------------------

export async function editWithAiTurn(storeId: string, input: EditWithAiInput): Promise<EditWithAiResult<EditWithAiTurnView>> {
  const who = await access(storeId);
  if (typeof who === "string") return fail(who);
  const { sellerId } = who;
  const ownStoreId = who.storeId;

  let creditReference: string | null = null;
  const giveBack = async () => {
    if (creditReference) await refundAiCredit(sellerId, creditReference).catch(() => {});
    creditReference = null;
  };

  try {
    if (!(await switchOn())) return fail("notFound");
    if (!aiConfigured()) return fail("aiUnavailable");
    if (!turnLimiter.check(`edit-ai:${sellerId}`)) return fail("rateLimited");
    const parsed = editWithAiInputSchema.safeParse(input);
    if (!parsed.success) return fail("invalidInput");
    const turn = parsed.data;

    const verified = turn.attachments.length ? await verifyEditWithAiAttachments(sellerId, ownStoreId, turn.attachments) : { ok: true as const, images: [], files: [], recorded: false };
    if (!verified.ok) return fail("attachmentInvalid");
    if (verified.recorded) revalidateDashboardPath(`/stores/${ownStoreId}/website/media`);

    const code = routeByCode({ message: turn.message, hasFile: verified.files.length > 0, imageCount: verified.images.length });

    // A products file never runs a model: the card opens the existing import with it.
    if (code?.route === "import") {
      const cards: EditWithAiCard[] = verified.files.map((file) => ({
        kind: "import_products",
        fileRef: file.path,
        fileName: file.name,
        href: `/stores/${ownStoreId}/products/add/from-file?aiFile=${encodeURIComponent(file.path)}`,
      }));
      console.info("[edit-with-ai] turn", { storeId: ownStoreId, route: "import", files: cards.length });
      return { success: true, data: { ...emptyView("import", REPLIES.import[turn.uiLocale]), cards } };
    }

    // Something this chat can't do, said plainly: code answers with the page that does it (no model, no cap).
    // A website edit that only mentions such a thing ("write cash on delivery in the banner") goes on as an edit,
    // and so do a question (advice) and a product request.
    if (code?.route !== "advice" && code?.route !== "products") {
      const help = outOfReach(turn.message, ownStoreId, { strongOnly: true }).filter((link) => code?.route !== "site" || link.key === "pages");
      if (help.length) {
        console.info("[edit-with-ai] turn", { storeId: ownStoreId, route: "help", links: help.length });
        return { success: true, data: { ...emptyView("help", REPLIES.help[turn.uiLocale]), links: help } };
      }
    }

    const billing = await getBillingState().catch(() => null);
    if (!billing) return fail("generic");
    const planRow = billing.usdLive
      ? (await db.select({ plan: sellers.plan, planExpiresAt: sellers.planExpiresAt, planGraceUntil: sellers.planGraceUntil }).from(sellers).where(eq(sellers.id, sellerId)))[0]
      : null;
    const limit = planRow && isProActive(planRow) ? dailyLimit() * PRO_DAILY_MULTIPLIER : dailyLimit();
    // Fails closed: without the usage table there is no cap, so no AI.
    const cap = await checkDailyCap(sellerId, EDIT_WITH_AI_FEATURE, limit).catch(() => null);
    if (!cap) return fail("generic");
    if (!cap.allowed) {
      await logAiUsage({ sellerId, feature: EDIT_WITH_AI_FEATURE, model: modelIdForTier("fast"), status: "blocked", errorCode: "daily_limit", refId: ownStoreId });
      return fail("aiDailyLimit");
    }

    const [editor, row, allowCode] = await Promise.all([
      getStoreForEditor(sellerId, ownStoreId),
      loadCodePreviewStore(sellerId, ownStoreId, undefined),
      isSwitchOn("code_sections").catch(() => false),
    ]);
    if (!editor || !row) return fail("notFound");
    const defaultLocale: SiteLocale = editor.store.defaultLocale === "en" ? "en" : "ar";
    const locales = (editor.store.supportedLocales ?? []).filter((l): l is SiteLocale => l === "ar" || l === "en");
    // The language the canvas shows, only when it is one of the store's.
    const contentLocale: SiteLocale = turn.contentLocale && (turn.contentLocale === defaultLocale || locales.includes(turn.contentLocale)) ? turn.contentLocale : defaultLocale;
    const page = turn.pageId ? editor.pages.find((p) => p.id === turn.pageId) : (editor.pages.find((p) => p.isHome) ?? editor.pages[0]);
    if (!page) return fail("notFound");
    const pageContent = validatePageContent(page.draftContent ?? { sections: [] }, { serverChecks: CODE_SERVER_CHECKS });
    if (!pageContent.success) return fail("generic");
    const header = validChrome(editor.store.sharedHeader);
    const footer = validChrome(editor.store.sharedFooter);
    const outline = siteOutline(pageContent.data.sections, defaultLocale);
    const pageContext: EditWithAiPageContext = { name: pageName(page.name, defaultLocale), kind: page.kind === "product" ? "product" : page.isHome ? "home" : "page" };
    const outlineText = () => serializeSiteOutline({ page: outline, header: header ? siteOutlineEntry(header, defaultLocale) : null, footer: footer ? siteOutlineEntry(footer, defaultLocale) : null });
    // The canvas selection: ids only, used only when they are in the loaded drafts.
    const selected = selectedTarget(turn.target, pageContent.data.sections, !!header, !!footer);
    const withCredits = async (view: EditWithAiTurnView): Promise<EditWithAiTurnView> => ({ ...view, creditsRemaining: await creditsLeft(sellerId, billing.usdLive) });

    // Route and section: code first, else one cheap router call on the outline.
    let route: Exclude<EditWithAiRoute, "import" | "help"> | null = code ? code.route : null;
    let target: CodeTarget | null = null;
    /** A site turn about the whole page: the model reads the page's sections, not one. */
    let pageScope = false;
    let calls = 0;
    let cachedCalls = 0;
    const routerCall = async () => {
      calls += 1;
      const { object, cached } = await generateStructured({
        feature: EDIT_WITH_AI_FEATURE,
        refId: ownStoreId,
        sellerId,
        tier: "fast",
        schema: editWithAiRouterSchema,
        system: EDIT_WITH_AI_ROUTER_SYSTEM,
        content: [
          {
            type: "text",
            text: editWithAiRouterText({ outlineText: outlineText(), message: turn.message, imageCount: verified.images.length, page: pageContext, selected: !!selected }),
          },
        ],
        thinkingLevel: "minimal",
        maxOutputTokens: ROUTER_OUTPUT_TOKENS,
        cacheMs: RESULT_CACHE_MS,
      });
      if (cached) cachedCalls += 1;
      return object;
    };

    if (route === null || route === "site") {
      // A selected section is the target; else code picks it when it can.
      target = route === "site" ? (selected ?? pickTargetByCode({ message: turn.message, outline, hasHeader: !!header, hasFooter: !!footer })) : null;
      // Code can tell the request is about the whole page: no router call.
      if (route === "site" && !target && scopeByCode(turn.message) === "page") {
        target = { kind: "page" };
        pageScope = true;
      }
      if (!target) {
        let routed: Awaited<ReturnType<typeof routerCall>>;
        try {
          routed = await routerCall();
        } catch (error) {
          console.error("[edit-with-ai] router failed", { storeId: ownStoreId, kind: aiErrorKind(error) });
          return fail("aiFailed");
        }
        if (route === null) route = routed.route;
        if (route === "none") {
          console.info("[edit-with-ai] turn", { storeId: ownStoreId, route: "none", calls });
          return { success: true, data: await withCredits({ ...emptyView("none", (routed.reply ?? "").trim().slice(0, 300) || REPLIES.none[turn.uiLocale]), links: outOfReach(turn.message, ownStoreId) }) };
        }
        if (route === "site") {
          target = selected ?? targetFromRouter(routed, outline, !!header, !!footer);
          // The whole page, when the router (or code, when the router left the scope out) says so and nothing is selected.
          if (!selected && target?.kind === "page" && !target.sectionId && (routed.scope === "page" || (routed.scope == null && scopeByCode(turn.message) === "page"))) {
            target = { kind: "page" };
            pageScope = true;
          }
        }
      }
    }

    // ---- A question about the website: an answer and follow-ups, no ops and no credit ----
    if (route === "advice") {
      let advice: { reply: string; suggestions: string[] | null };
      try {
        calls += 1;
        const { object } = await generateStructured({
          feature: EDIT_WITH_AI_FEATURE,
          refId: ownStoreId,
          sellerId,
          tier: "fast",
          schema: editWithAiAdviceSchema,
          system: EDIT_WITH_AI_ADVICE_SYSTEM,
          content: [
            {
              type: "text",
              text: editWithAiAdviceText({
                outlineText: outlineText(),
                message: turn.message,
                facts: pageFacts(pageContent.data.sections, outline),
                page: pageContext,
                selected: !!selected,
                locales: locales.length ? locales : [defaultLocale],
                history: turn.history,
              }),
            },
          ],
          // The facts are counted by code and the answer is short copy, so no reasoning budget (docs/ai.md rule 5).
          thinkingLevel: "minimal",
          maxOutputTokens: ADVICE_OUTPUT_TOKENS,
          cacheMs: RESULT_CACHE_MS,
        });
        advice = object;
      } catch (error) {
        console.error("[edit-with-ai] advice failed", { storeId: ownStoreId, kind: aiErrorKind(error) });
        return fail("aiFailed");
      }
      const suggestions = cleanAgentSuggestions(advice.suggestions);
      console.info("[edit-with-ai] turn", { storeId: ownStoreId, route: "advice", calls, suggestions: suggestions.length });
      return {
        success: true,
        data: await withCredits({ ...emptyView("advice", cleanAgentReply(advice.reply, MAX_ADVICE_REPLY_LENGTH) || REPLIES.none[turn.uiLocale]), suggestions }),
      };
    }

    if (route !== "site") {
      const answered = await storeTurn({ who, route: route as StoreRoute, message: turn.message, uiLocale: turn.uiLocale, history: turn.history, images: verified.images, currency: parseStoreCurrency(row.settings).currency });
      return answered.success ? { success: true, data: await withCredits(answered.data) } : answered;
    }

    // ---- A site turn ----
    const noTarget = async () => ({ success: true as const, data: await withCredits({ ...emptyView("site", REPLIES.noTarget[turn.uiLocale]), links: outOfReach(turn.message, ownStoreId) }) });
    if (!target) return await noTarget();
    const chrome = target.kind === "header" ? header : target.kind === "footer" ? footer : null;
    if (target.kind !== "page" && !chrome) return await noTarget();
    const sectionId = target.kind === "page" ? target.sectionId : undefined;
    const section = target.kind === "page" ? (sectionId ? (pageContent.data.sections.find((s) => s.id === sectionId) ?? null) : null) : chrome;
    if (target.kind === "page" && sectionId && !section) return await noTarget();

    // Photos: this turn's uploads, and the store's media the seller linked in the message.
    const mentioned = mediaPathsIn(turn.message);
    const media: AgentMediaImage[] = [
      ...verified.images,
      ...(mentioned.length ? await ownMediaImages(sellerId, ownStoreId, mentioned.filter((p) => !verified.images.some((i) => i.path === p))) : []),
    ];
    const images: EditorAgentImage[] = media.map(({ src, label }) => ({ src, label }));

    if (billing.usdLive) {
      const claim = await claimAiCredit(sellerId, EDIT_WITH_AI_FEATURE).catch(() => null);
      if (!claim) return fail("generic");
      if (!claim.ok) {
        await logAiUsage({ sellerId, feature: EDIT_WITH_AI_FEATURE, model: modelIdForTier("fast"), status: "blocked", errorCode: "no_credits", refId: ownStoreId });
        return fail("aiNoCredits");
      }
      creditReference = claim.reference;
    }

    const agentTarget = target.kind === "page" ? { kind: "page" as const, ...(sectionId && { sectionId }) } : { kind: target.kind };
    // Page scope only with nothing targeted: the core checks it again and marks the target it returns.
    const pageSections = pageScope && target.kind === "page" && !sectionId ? pageContent.data.sections : undefined;
    let result: Awaited<ReturnType<typeof runEditorAgentTurn>>;
    try {
      result = await runEditorAgentTurn(
        {
          message: turn.message,
          uiLocale: turn.uiLocale,
          contentLocale,
          target: agentTarget,
          section,
          outline: outline.map(({ id, name, kind }) => ({ id, name, kind })),
          history: turn.history,
          store: { name: row.name, defaultLocale, locales: locales.length ? locales : [defaultLocale], colors: asRecord(row.colors), typography: asRecord(row.typography) },
          allowCode,
          // The saved drafts (the editor saved its pending edits before the turn): the page, or the header or footer alone.
          content: target.kind === "page" ? { sections: pageContent.data.sections } : { sections: [chrome!] },
          maxModelCalls: Math.max(1, cap.remaining - calls),
          page: pageContext,
          ...(pageSections && { pageSections }),
          images,
          allowImage: mediaImageCheck(media),
        },
        {
          callModel: async ({ system, text }) => {
            calls += 1;
            const { object, cached } = await generateStructured({
              feature: EDIT_WITH_AI_FEATURE,
              refId: ownStoreId,
              sellerId,
              tier: "fast",
              schema: editorAgentModelOutputWithSuggestionsSchema,
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
      console.error("[edit-with-ai] model call failed", { storeId: ownStoreId, kind: aiErrorKind(error) });
      return fail("aiFailed");
    }

    const rejected = result.rejected.map(({ index, code: reason }) => ({ index, code: reason }));
    if (result.applied.length === 0) {
      await giveBack();
      return { success: true, data: await withCredits({ ...emptyView("site", result.reply), suggestions: result.suggestions, links: outOfReach(turn.message, ownStoreId), rejected }) };
    }

    // Nothing is written here: the editor applies the ops to its drafts (one undo step) and autosave saves them.
    // A turn that came back from the result cache is free.
    if (calls > 0 && cachedCalls === calls) await giveBack();
    const creditsUsed = creditReference ? 1 : 0;
    // The code elements the ops wrote, rendered for the canvas exactly as the editor's own agent does.
    const previews = result.codeNodes.length
      ? await renderAgentCodePreviews(sellerId, ownStoreId, { ...row, pageKind: page.kind ?? null }, contentLocale, defaultLocale, result.codeNodes).catch(() => ({}))
      : {};

    console.info("[edit-with-ai] turn", { storeId: ownStoreId, route: "site", target: target.kind, scope: result.target.scope ?? "section", applied: result.applied.length, rejected: rejected.length, calls, retried: result.retried, code: allowCode, images: images.length });
    return {
      success: true,
      data: {
        reply: result.reply,
        route: "site",
        // The target the core checked the ops against (page scope marked), so the editor applies them the same way.
        siteChanges: { pageId: page.id, target: result.target, ops: result.ops, applied: result.summary, previews, contentLocale },
        proposals: [],
        cards: [],
        suggestions: result.suggestions,
        links: [],
        rejected,
        creditsUsed,
        creditsRemaining: await creditsLeft(sellerId, billing.usdLive),
      },
    };
  } catch (error) {
    await giveBack();
    if (isAccessError(error)) return fail(error.code === "store_read_only" ? "readOnly" : "notFound");
    // Ids only: never the message, the files or the code.
    console.error("[edit-with-ai] failed", { storeId: ownStoreId });
    return fail("generic");
  }
}

type StoreRoute = "products" | "settings" | "shipping" | "design";

/** A store-data turn on the agent core: confirm cards only, nothing written. */
async function storeTurn(input: {
  who: Access;
  route: StoreRoute;
  message: string;
  uiLocale: "ar" | "en";
  history: readonly { role: "user" | "assistant"; text: string }[];
  images: readonly { src: string }[];
  currency: string;
}): Promise<EditWithAiResult<EditWithAiTurnView>> {
  const publishProducts = input.route === "products" && wantsPublish(input.message);
  const ctx = editWithAiContext({ sellerId: input.who.sellerId, storeId: input.who.storeId, userId: input.who.userId, locale: input.uiLocale, publishProducts });
  const runtime = editWithAiRuntime(input.who.sellerId, input.who.storeId);
  try {
    const result = await runStoreAgentTurn(runtime, ctx, {
      skillId: input.route,
      message: input.message,
      stateSummary: storeTurnSummary({ images: input.images, currency: input.currency, publishProducts, history: input.history }),
    });
    console.info("[edit-with-ai] turn", { storeId: input.who.storeId, route: input.route, proposals: result.proposals.length, rejected: result.rejected.length, steps: result.steps });
    return {
      success: true,
      data: {
        ...emptyView(input.route, result.text),
        proposals: result.proposals.map(toProposalView),
        // Nothing proposed: when the request names something done elsewhere, say where.
        links: result.proposals.length ? [] : outOfReach(input.message, input.who.storeId),
        rejected: result.rejected.map(({ tool, code }) => ({ tool, code })),
      },
    };
  } catch (error) {
    const key = agentErrorKey(error);
    console.error("[edit-with-ai] agent turn failed", { storeId: input.who.storeId, route: input.route, error: key });
    return fail(key === "actionFailed" ? "aiFailed" : key);
  }
}

/** A page's name for the prompt, in the store's default language (names may be stored per language). */
function pageName(name: unknown, locale: SiteLocale): string {
  if (typeof name === "string") return name;
  const bag = asRecord(name);
  const value = bag?.[locale] ?? bag?.ar ?? bag?.en;
  return typeof value === "string" ? value : "";
}

function targetFromRouter(routed: { target: "page" | "header" | "footer" | null; sectionId: string | null }, outline: readonly SiteOutlineEntry[], hasHeader: boolean, hasFooter: boolean): CodeTarget | null {
  if (routed.target === "header") return hasHeader ? { kind: "header" } : null;
  if (routed.target === "footer") return hasFooter ? { kind: "footer" } : null;
  if (!routed.sectionId) return { kind: "page", add: true };
  // Only an id of the outline: a made-up one picks nothing.
  return outline.some((entry) => entry.id === routed.sectionId) ? { kind: "page", sectionId: routed.sectionId } : null;
}

/** The client's selection as a target, only when the saved drafts have it; anything else is no selection. */
function selectedTarget(input: EditWithAiTargetInput | undefined, sections: readonly SectionInstance[], hasHeader: boolean, hasFooter: boolean): CodeTarget | null {
  if (!input) return null;
  if (input.kind !== "page") return (input.kind === "header" ? hasHeader : hasFooter) ? { kind: input.kind } : null;
  return sections.some((section) => section.id === input.sectionId) ? { kind: "page", sectionId: input.sectionId } : null;
}

function validChrome(value: unknown): SectionInstance | null {
  if (!value) return null;
  const checked = validatePageContent({ sections: [value] }, { serverChecks: CODE_SERVER_CHECKS });
  return checked.success ? (checked.data.sections[0] ?? null) : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

// ---------------------------------------------------------------------------
// Confirm and cancel (the agent core's pending actions)
// ---------------------------------------------------------------------------

/** Runs one proposed store change the seller confirmed. The core charges its credit (1 per write) and refunds it when the run fails. */
export async function confirmEditWithAiAction(storeId: string, actionId: string): Promise<EditWithAiResult<EditWithAiConfirmView>> {
  const who = await access(storeId);
  if (typeof who === "string") return fail(who);
  try {
    if (!(await switchOn())) return fail("notFound");
    if (!actionLimiter.check(`edit-ai-confirm:${who.sellerId}`)) return fail("rateLimited");
    if (!actionIdSchema.safeParse(actionId).success) return fail("invalidInput");
    const publishes = await pendingPublishes({ sellerId: who.sellerId, storeId: who.storeId }, actionId);
    if (publishes === null) return fail("notFound");
    const ctx = editWithAiContext({ sellerId: who.sellerId, storeId: who.storeId, userId: who.userId, locale: "ar", publishProducts: publishes });
    const done = await editWithAiRuntime(who.sellerId, who.storeId).confirmAction(ctx, actionId);
    console.info("[edit-with-ai] confirmed", { storeId: who.storeId, tool: done.tool, credits: done.creditsCharged, replayed: done.replayed });
    const billing = await getBillingState().catch(() => null);
    return { success: true, data: { tool: done.tool, result: done.result, creditsUsed: done.creditsCharged, creditsRemaining: await creditsLeft(who.sellerId, billing?.usdLive === true) } };
  } catch (error) {
    const key = agentErrorKey(error);
    console.error("[edit-with-ai] confirm failed", { storeId: who.storeId, error: key });
    return fail(key);
  }
}

export async function cancelEditWithAiAction(storeId: string, actionId: string): Promise<EditWithAiResult<null>> {
  const who = await access(storeId);
  if (typeof who === "string") return fail(who);
  try {
    if (!(await switchOn())) return fail("notFound");
    if (!actionLimiter.check(`edit-ai-cancel:${who.sellerId}`)) return fail("rateLimited");
    if (!actionIdSchema.safeParse(actionId).success) return fail("invalidInput");
    const ctx = editWithAiContext({ sellerId: who.sellerId, storeId: who.storeId, userId: who.userId, locale: "ar", publishProducts: false });
    await editWithAiRuntime(who.sellerId, who.storeId).cancelAction(ctx, actionId);
    return { success: true, data: null };
  } catch (error) {
    return fail(agentErrorKey(error));
  }
}
