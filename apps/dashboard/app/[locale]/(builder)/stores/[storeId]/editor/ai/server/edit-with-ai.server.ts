"use server";

import { randomBytes } from "node:crypto";
import { aiConfigured, aiErrorKind, checkDailyCap, generateStructured, logAiUsage, modelIdForTier } from "@workspace/ai";
import { db, eq, sellers } from "@workspace/db";
import { parseStoreCurrency } from "@workspace/lib";
import { isProActive } from "@workspace/lib/billing";
import { claimAiCredit, refundAiCredit } from "@workspace/lib/billing/credits";
import { getBillingState } from "@workspace/lib/billing/server";
import { getStoreForEditor, saveStoreChrome, saveStorePageDraft } from "@workspace/lib/store-sites/server";
import { validatePageContent, type SectionInstance, type SiteLocale } from "@workspace/store-sections";
import {
  editorAgentModelOutputSchema,
  runEditorAgentTurn,
  serializeSiteOutline,
  siteOutline,
  siteOutlineEntry,
  type EditorAgentImage,
  type SiteOutlineEntry,
} from "@workspace/store-sections/agent-server";
import { CODE_SERVER_CHECKS } from "@workspace/store-sections/code-server";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { mediaImageCheck, mediaPathsIn, ownMediaImages, type AgentMediaImage } from "../../server/agent-images.server";
import { loadCodePreviewStore } from "../../server/code-preview.data";
import { previewLink } from "../../server/editor.server";
import {
  actionIdSchema,
  editWithAiInputSchema,
  editWithAiUploadsInputSchema,
  undoTokenSchema,
  type EditWithAiCard,
  type EditWithAiError,
  type EditWithAiInput,
  type EditWithAiResult,
  type EditWithAiRoute,
  type EditWithAiTarget,
  type EditWithAiTurnView,
  type EditWithAiUpload,
  type EditWithAiUploadsInput,
} from "./edit-with-ai.dto";
import {
  EDIT_WITH_AI_FEATURE,
  EDIT_WITH_AI_ROUTER_SYSTEM,
  UndoStore,
  editWithAiRouterSchema,
  editWithAiRouterText,
  pickTargetByCode,
  routeByCode,
  wantsPublish,
  type CodeTarget,
} from "./edit-with-ai.lib";
import { agentErrorKey, editWithAiContext, editWithAiRuntime, pendingPublishes, runStoreAgentTurn, storeTurnSummary, toProposalView } from "./edit-with-ai-agent.server";
import { signEditWithAiFileLink, signEditWithAiUploads, verifyEditWithAiAttachments } from "./edit-with-ai-files.server";

/**
 * "Edit with AI" (owner request 2026-11-26): the website editor's chat page.
 * One turn can change the site's DRAFTS (applied and saved here, on the
 * server, through the normal validated draft save), propose store changes
 * (products, settings, shipping, theme) as confirm cards of the agent core,
 * or turn an attached products file into a card that opens the existing
 * from-file import. Nothing is published: the seller's Publish button calls
 * the editor's existing `publish` action.
 *
 * Order of checks: the store is the session seller's and writable, the
 * `editor_agent` switch, AI is set up, a burst limit, the input caps and the
 * attachments (uploaded, this seller's and store's, real type), the daily
 * cap, then 1 AI credit for a site turn (claimed before the edit call, given
 * back when nothing was saved or the answer came from the result cache).
 * Store-data turns cost nothing here: the core charges 1 credit when the
 * seller confirms a card. Logs ids and counts only.
 *
 * Cost (docs/ai.md): code routes and picks the section when it can; else one
 * `fast`, thinking-minimal router call on a capped outline; then the editor
 * agent's one `fast` call (one retry only for a failed code op).
 */

const RESULT_CACHE_MS = 10 * 60_000;
const MAX_OUTPUT_TOKENS = 12_000;
const ROUTER_OUTPUT_TOKENS = 300;
const PRO_DAILY_MULTIPLIER = 10;
const ALLOWED = storeSectionRegistry.allowedSections();

/** Model calls a day for this feature (router + edit); ×10 on Pro. */
const dailyLimit = () => {
  const value = Number(process.env.AI_EDIT_WITH_AI_DAILY_LIMIT);
  return Number.isInteger(value) && value >= 0 ? value : 60;
};

// Bursts per instance; the daily cap is the real, cross-instance limit.
const turnLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
const actionLimiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

/** Previous drafts of saved turns, per instance (see `UndoStore`). */
const undoStore = new UndoStore();

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
  return { reply, route, siteChanges: null, proposals: [], cards: [], rejected: [], creditsUsed: 0 };
}

const REPLIES = {
  import: { ar: "جهزت لك ملف المنتجات. اضغط على البطاقة عشان تراجع المنتجات قبل ما تضيفها.", en: "Your products file is ready. Open the card to review the products before adding them." },
  noTarget: { ar: "مش لاقي الجزء ده في الموقع. قولّي اسم القسم أو مكانه.", en: "I couldn't find that part of the site. Tell me the section's name or where it is." },
  none: { ar: "قولّي تحب تغيّر إيه في موقعك أو منتجاتك.", en: "Tell me what you'd like to change on your site or products." },
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
    const page = turn.pageId ? editor.pages.find((p) => p.id === turn.pageId) : (editor.pages.find((p) => p.isHome) ?? editor.pages[0]);
    if (!page) return fail("notFound");
    const pageContent = validatePageContent(page.draftContent ?? { sections: [] }, { serverChecks: CODE_SERVER_CHECKS });
    if (!pageContent.success) return fail("generic");
    const header = validChrome(editor.store.sharedHeader);
    const footer = validChrome(editor.store.sharedFooter);
    const outline = siteOutline(pageContent.data.sections, defaultLocale);

    // Route and section: code first, else one cheap router call on the outline.
    let route: Exclude<EditWithAiRoute, "import"> | null = code ? code.route : null;
    let target: CodeTarget | null = null;
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
            text: editWithAiRouterText({
              outlineText: serializeSiteOutline({ page: outline, header: header ? siteOutlineEntry(header, defaultLocale) : null, footer: footer ? siteOutlineEntry(footer, defaultLocale) : null }),
              message: turn.message,
              imageCount: verified.images.length,
            }),
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
      target = route === "site" ? pickTargetByCode({ message: turn.message, outline, hasHeader: !!header, hasFooter: !!footer }) : null;
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
          return { success: true, data: emptyView("none", (routed.reply ?? "").trim().slice(0, 300) || REPLIES.none[turn.uiLocale]) };
        }
        if (route === "site") target = targetFromRouter(routed, outline, !!header, !!footer);
      }
    }

    if (route !== "site") {
      return await storeTurn({ who, route: route!, message: turn.message, uiLocale: turn.uiLocale, history: turn.history, images: verified.images, currency: parseStoreCurrency(row.settings).currency });
    }

    // ---- A site turn ----
    if (!target) return { success: true, data: emptyView("site", REPLIES.noTarget[turn.uiLocale]) };
    const chrome = target.kind === "header" ? header : target.kind === "footer" ? footer : null;
    if (target.kind !== "page" && !chrome) return { success: true, data: emptyView("site", REPLIES.noTarget[turn.uiLocale]) };
    const sectionId = target.kind === "page" ? target.sectionId : undefined;
    const section = target.kind === "page" ? (sectionId ? (pageContent.data.sections.find((s) => s.id === sectionId) ?? null) : null) : chrome;
    if (target.kind === "page" && sectionId && !section) return { success: true, data: emptyView("site", REPLIES.noTarget[turn.uiLocale]) };

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
    let result: Awaited<ReturnType<typeof runEditorAgentTurn>>;
    try {
      result = await runEditorAgentTurn(
        {
          message: turn.message,
          uiLocale: turn.uiLocale,
          contentLocale: defaultLocale,
          target: agentTarget,
          section,
          outline: outline.map(({ id, name, kind }) => ({ id, name, kind })),
          history: turn.history,
          store: { name: row.name, defaultLocale, locales: locales.length ? locales : [defaultLocale], colors: asRecord(row.colors), typography: asRecord(row.typography) },
          allowCode,
          // The real drafts: the page as stored, or the header or footer alone.
          content: target.kind === "page" ? { sections: pageContent.data.sections } : { sections: [chrome!] },
          maxModelCalls: Math.max(1, cap.remaining - calls),
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
      console.error("[edit-with-ai] model call failed", { storeId: ownStoreId, kind: aiErrorKind(error) });
      return fail("aiFailed");
    }

    const rejected = result.rejected.map(({ index, code: reason }) => ({ index, code: reason }));
    if (result.applied.length === 0) {
      await giveBack();
      return { success: true, data: { ...emptyView("site", result.reply), rejected } };
    }

    // Save with the version that was loaded: an edit made meanwhile (the manual editor in another tab) is never overwritten.
    const saved =
      target.kind === "page"
        ? await saveStorePageDraft(sellerId, ownStoreId, page.id, result.content, page.draftVersion, { allowedSections: ALLOWED })
        : await saveStoreChrome(sellerId, ownStoreId, target.kind, result.content.sections[0] ?? null, editor.store.chromeVersion, { allowedSections: ALLOWED });
    if (!saved.success) {
      await giveBack();
      console.info("[edit-with-ai] save refused", { storeId: ownStoreId, error: saved.error });
      return fail(saved.error === "version_conflict" ? "draftChanged" : saved.error === "store_read_only" ? "readOnly" : saved.error === "not_found" ? "notFound" : "generic");
    }
    const version = "draftVersion" in saved.data ? saved.data.draftVersion : saved.data.version;

    const undoToken = randomBytes(18).toString("base64url");
    undoStore.put(undoToken, {
      sellerId,
      storeId: ownStoreId,
      target: target.kind === "page" ? { kind: "page", pageId: page.id } : { kind: target.kind },
      previous: target.kind === "page" ? page.draftContent : chrome,
      version,
    });

    // A turn that came back from the result cache is free.
    if (calls > 0 && cachedCalls === calls) await giveBack();
    const creditsUsed = creditReference ? 1 : 0;
    const preview = await previewLink(ownStoreId).catch(() => null);
    const viewTarget: EditWithAiTarget = target.kind === "page" ? { kind: "page", pageId: page.id, ...(sectionId && { sectionId }) } : { kind: target.kind };

    console.info("[edit-with-ai] turn", { storeId: ownStoreId, route: "site", target: target.kind, applied: result.applied.length, rejected: rejected.length, calls, retried: result.retried, code: allowCode, images: images.length });
    return {
      success: true,
      data: {
        reply: result.reply,
        route: "site",
        siteChanges: { target: viewTarget, lines: result.summary, undoToken, previewUrl: preview?.success ? preview.data.url : null },
        proposals: [],
        cards: [],
        rejected,
        creditsUsed,
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

/** A store-data turn on the agent core: confirm cards only, nothing written. */
async function storeTurn(input: {
  who: Access;
  route: Exclude<EditWithAiRoute, "site" | "import" | "none">;
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
        rejected: result.rejected.map(({ tool, code }) => ({ tool, code })),
      },
    };
  } catch (error) {
    const key = agentErrorKey(error);
    console.error("[edit-with-ai] agent turn failed", { storeId: input.who.storeId, route: input.route, error: key });
    return fail(key === "actionFailed" ? "aiFailed" : key);
  }
}

function targetFromRouter(routed: { target: "page" | "header" | "footer" | null; sectionId: string | null }, outline: readonly SiteOutlineEntry[], hasHeader: boolean, hasFooter: boolean): CodeTarget | null {
  if (routed.target === "header") return hasHeader ? { kind: "header" } : null;
  if (routed.target === "footer") return hasFooter ? { kind: "footer" } : null;
  if (!routed.sectionId) return { kind: "page", add: true };
  // Only an id of the outline: a made-up one picks nothing.
  return outline.some((entry) => entry.id === routed.sectionId) ? { kind: "page", sectionId: routed.sectionId } : null;
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
// Undo
// ---------------------------------------------------------------------------

/**
 * Puts back the draft a turn replaced, only while the draft is still the
 * version that turn saved (a newer edit, from this chat or the manual
 * editor, refuses it with `draftChanged`). One use per token.
 */
export async function undoEditWithAi(storeId: string, token: string): Promise<EditWithAiResult<{ previewUrl: string | null }>> {
  const who = await access(storeId);
  if (typeof who === "string") return fail(who);
  try {
    if (!(await switchOn())) return fail("notFound");
    if (!actionLimiter.check(`edit-ai-undo:${who.sellerId}`)) return fail("rateLimited");
    if (!undoTokenSchema.safeParse(token).success) return fail("invalidInput");
    const entry = undoStore.get(who.storeId, token, who.sellerId);
    if (!entry) return fail("undoExpired");
    const saved =
      entry.target.kind === "page"
        ? await saveStorePageDraft(who.sellerId, who.storeId, entry.target.pageId, entry.previous, entry.version, { allowedSections: ALLOWED })
        : await saveStoreChrome(who.sellerId, who.storeId, entry.target.kind, entry.previous ?? null, entry.version, { allowedSections: ALLOWED });
    if (!saved.success) return fail(saved.error === "version_conflict" ? "draftChanged" : saved.error === "store_read_only" ? "readOnly" : saved.error === "not_found" ? "notFound" : "generic");
    undoStore.delete(who.storeId, token);
    const preview = await previewLink(who.storeId).catch(() => null);
    console.info("[edit-with-ai] undo", { storeId: who.storeId, target: entry.target.kind });
    return { success: true, data: { previewUrl: preview?.success ? preview.data.url : null } };
  } catch {
    console.error("[edit-with-ai] undo failed", { storeId: who.storeId });
    return fail("generic");
  }
}

// ---------------------------------------------------------------------------
// Confirm and cancel (the agent core's pending actions)
// ---------------------------------------------------------------------------

/** Runs one proposed store change the seller confirmed. The core charges its credit (1 per write) and refunds it when the run fails. */
export async function confirmEditWithAiAction(storeId: string, actionId: string): Promise<EditWithAiResult<{ tool: string; result: unknown; creditsUsed: number }>> {
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
    return { success: true, data: { tool: done.tool, result: done.result, creditsUsed: done.creditsCharged } };
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
    if (!actionLimiter.check(`edit-ai-cancel:${who.sellerId}`)) return fail("rateLimited");
    if (!actionIdSchema.safeParse(actionId).success) return fail("invalidInput");
    const ctx = editWithAiContext({ sellerId: who.sellerId, storeId: who.storeId, userId: who.userId, locale: "ar", publishProducts: false });
    await editWithAiRuntime(who.sellerId, who.storeId).cancelAction(ctx, actionId);
    return { success: true, data: null };
  } catch (error) {
    return fail(agentErrorKey(error));
  }
}
