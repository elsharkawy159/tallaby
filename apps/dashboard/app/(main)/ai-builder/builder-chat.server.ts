import { randomUUID } from "node:crypto";
import { aiConfigured, aiErrorKind, generateStructured } from "@workspace/ai";
import { getBillingState } from "@workspace/lib/billing/server";
import { getCodeTemplate, templateMeta, CODE_TEMPLATES } from "@workspace/store-sections/templates";
import { builderPhotoUrl } from "./builder-upload.lib";
import {
  BUILDER_FEATURES,
  BUILDER_LIMITS,
  builderBriefOutputSchema,
  builderChatOutputSchema,
  type BuilderAnswer,
  type BuilderErrorCode,
  type BuilderState,
  type BuilderTemplateChoice,
  type BuilderView,
} from "./builder.dto";
import { applyAnswer, currentStep, mergeReading, shortlistTemplates, withNextQuestion, withSellerMessage } from "./builder.lib";
import { MAX_TEMPLATES_SHOWN, fileProblems, nextCard } from "./builder-questions.lib";
import { BRIEF_SYSTEM_RULES, CHAT_SYSTEM_RULES, briefRequestText, chatRequestText } from "./builder-prompts.lib";
import { checkModelCall, claimFreeBuild, giveCreditBack, saveBuild, type BuildRow, type ModelGate } from "./builder.store.server";

/**
 * The conversation's server side (ROADMAP.md F-54c). Called only by the chat
 * route, after the session check. The code asks the questions; the model only
 * reads free text and writes the brief card. Cost rules: docs/ai.md.
 */

/** The same text again within this window is free. */
const RESULT_CACHE_MS = 10 * 60_000;

export type ChatContext = {
  sellerId: string;
  /** From the session. */
  emailConfirmed: boolean;
  ip: string | null;
};

export type ChatResult = { view: BuilderView; error?: BuilderErrorCode };

export function toView(build: BuildRow, notice: BuilderErrorCode | null = null): BuilderView {
  const paths = [...build.state.products.flatMap((product) => product.photos), ...(build.state.logo ? [build.state.logo] : [])];
  const v2 = build.state.flow === "v2";
  // Built fresh from the state, so it is always the card the code would accept (applyCardAnswers).
  const card = v2 && build.status === "collecting" ? nextCard(build.state) : null;

  const templates: BuilderTemplateChoice[] = build.state.shortlist.flatMap((key) => {
    const template = getCodeTemplate(key);
    return template ? [{ key, name: template.name, description: template.description, palette: templateMeta(template).palette }] : [];
  });
  return {
    id: build.id,
    status: build.status,
    step: currentStep(build.state),
    state: build.state,
    free: build.free,
    chatTurns: build.chatTurns,
    storeId: build.storeId,
    photoUrls: Object.fromEntries(paths.map((path) => [path, builderPhotoUrl(path)])),
    templates,
    notice,
    flow: v2 ? "v2" : "v1",
    round: card?.round ?? null,
    card,
    logoUrl: build.state.logo ? builderPhotoUrl(build.state.logo) : null,
    fileProblems: v2 ? fileProblems(build.state).slice(0, 50) : [],
    moreTemplates: v2 && card?.round === "design" && build.state.templatesShown.length < MAX_TEMPLATES_SHOWN,
  };
}

const gateError = (gate: Extract<ModelGate, { ok: false }>): BuilderErrorCode =>
  gate.reason === "budget" ? "budget" : gate.reason === "noCredits" ? "noCredits" : gate.reason === "dailyLimit" ? "dailyLimit" : "failed";

/** Reads free text into the state. Never fatal: without it the seller still answers by chips and forms. */
async function readText(build: BuildRow, state: BuilderState, text: string): Promise<{ state: BuilderState; turns: number; notice: BuilderErrorCode | null }> {
  if (!aiConfigured()) return { state, turns: build.chatTurns, notice: "disabled" };
  if (build.chatTurns >= BUILDER_LIMITS.chatTurns) return { state, turns: build.chatTurns, notice: "turnLimit" };
  const gate = await checkModelCall(build, BUILDER_FEATURES.chat);
  if (!gate.ok) return { state, turns: build.chatTurns, notice: gateError(gate) };
  try {
    const { object, cached } = await generateStructured({
      feature: BUILDER_FEATURES.chat,
      sellerId: build.sellerId,
      refId: build.id,
      tier: "fast",
      schema: builderChatOutputSchema,
      system: CHAT_SYSTEM_RULES,
      content: [{ type: "text", text: chatRequestText(state, text) }],
      thinkingLevel: "minimal",
      maxOutputTokens: 1500,
      cacheMs: RESULT_CACHE_MS,
    });
    return { state: mergeReading(state, object, text, () => randomUUID().slice(0, 12)), turns: build.chatTurns + (cached ? 0 : 1), notice: null };
  } catch (error) {
    console.error("[ai-builder] reading failed", error instanceof Error ? error.message : error);
    return { state, turns: build.chatTurns + 1, notice: aiErrorKind(error) };
  }
}

/** Writes the brief card when the conversation reaches it. */
async function writeBrief(build: BuildRow, state: BuilderState): Promise<{ state: BuilderState; notice: BuilderErrorCode | null }> {
  if (currentStep(state) !== "brief" || (state.brief && !state.briefNote)) return { state, notice: null };
  if (!aiConfigured()) return { state, notice: "disabled" };
  if (state.briefRuns >= BUILDER_LIMITS.briefRuns) return { state: { ...state, briefNote: null }, notice: "turnLimit" };
  const gate = await checkModelCall(build, BUILDER_FEATURES.brief);
  if (!gate.ok) return { state, notice: gateError(gate) };
  try {
    const { object, cached } = await generateStructured({
      feature: BUILDER_FEATURES.brief,
      sellerId: build.sellerId,
      refId: build.id,
      tier: "fast",
      schema: builderBriefOutputSchema,
      system: BRIEF_SYSTEM_RULES,
      content: [{ type: "text", text: briefRequestText(state) }],
      thinkingLevel: "minimal",
      maxOutputTokens: 500,
      cacheMs: RESULT_CACHE_MS,
    });
    if (cached) await giveCreditBack(build.sellerId, gate.creditReference);
    const clean = (value: string, max: number) => value.replace(/[<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
    return {
      state: {
        ...state,
        briefRuns: state.briefRuns + 1,
        briefNote: null,
        brief: {
          // The seller's own Latin name wins over the model's transliteration.
          nameEn: clean(state.nameEn ?? object.nameEn, 40),
          taglineAr: clean(object.taglineAr, 70),
          taglineEn: clean(object.taglineEn, 70),
          audience: clean(object.audience, 80),
          tone: clean(object.tone, 60),
          styleWords: object.styleWords.map((word) => clean(word, 20)).filter(Boolean).slice(0, 5),
        },
      },
      notice: null,
    };
  } catch (error) {
    await giveCreditBack(build.sellerId, gate.creditReference);
    console.error("[ai-builder] brief failed", error instanceof Error ? error.message : error);
    return { state, notice: aiErrorKind(error) };
  }
}

/** The templates to offer, chosen in code (no catalog in any prompt), once the brief is confirmed. */
export function withShortlist(state: BuilderState, seed: string): BuilderState {
  if (currentStep(state) !== "template" || state.shortlist.length) return state;
  const templates = CODE_TEMPLATES.map(({ key, category, name, description }) => ({ key, category, name, description }));
  return { ...state, shortlist: shortlistTemplates(templates, state.industryId, state.brief?.styleWords ?? [], seed) };
}

const answerLabel = (answer: BuilderAnswer) => (answer.type === "text" ? answer.text : answer.type === "chip" ? `chip:${answer.value}` : "chip:skip");

/** One answer from the seller: applied, read if needed, saved, and the next question asked. */
export async function answerQuestion(ctx: ChatContext, build: BuildRow, answer: BuilderAnswer): Promise<ChatResult> {
  const result = applyAnswer(build.state, answer);
  if (result.kind === "error") return { view: toView(build), error: result.error };

  if (result.kind === "confirmBrief") return confirmBrief(ctx, build);
  if (result.kind === "build") {
    const state = withSellerMessage(build.state, answerLabel(answer));
    const next = { ...build, state, status: "building" as const };
    await saveBuild(ctx.sellerId, build.id, { state, status: "building" });
    return { view: toView(next) };
  }

  let state = withSellerMessage(result.state ?? build.state, answerLabel(answer));
  let turns = build.chatTurns;
  let notice: BuilderErrorCode | null = null;

  if (result.kind === "read") {
    const read = await readText(build, state, result.text);
    state = read.state;
    turns = read.turns;
    notice = read.notice;
  }

  const written = await writeBrief(build, state);
  state = withNextQuestion(withShortlist(written.state, build.id));
  notice = notice ?? written.notice;

  const next = { ...build, state, chatTurns: turns };
  await saveBuild(ctx.sellerId, build.id, { state, chatTurns: turns });
  return { view: toView(next, notice) };
}

/** The seller confirmed the card. The account's free build is taken here, or credits apply. */
async function confirmBrief(ctx: ChatContext, build: BuildRow): Promise<ChatResult> {
  if (!ctx.emailConfirmed) return { view: toView(build), error: "emailNotConfirmed" };
  let paid = build.state.paid;
  let free = build.free;
  if (!paid && !free) {
    const claim = await claimFreeBuild({ sellerId: ctx.sellerId, buildId: build.id, phone: build.state.contact.phone, ip: ctx.ip });
    if (claim === "phoneUsed" || claim === "ipLimit" || claim === "platformBusy") return { view: toView(build), error: claim };
    if (claim === "already") {
      // The free build was used: this one runs on credits, so credits must be on (as startBuild checks).
      const billing = await getBillingState().catch(() => null);
      if (!billing?.usdLive) return { view: toView(build), error: "creditsNotLive" };
      paid = true;
    } else free = true;
  }
  const state = withNextQuestion(withShortlist(withSellerMessage({ ...build.state, paid, briefConfirmed: true }, "chip:confirm"), build.id));
  await saveBuild(ctx.sellerId, build.id, { state });
  return { view: toView({ ...build, state, free }) };
}

/** Called when the conversation opens, and when a saved one reaches the brief with no card yet (a failed call). */
export async function refreshBrief(ctx: ChatContext, build: BuildRow): Promise<ChatResult> {
  const written = await writeBrief(build, build.state);
  if (written.state === build.state) return { view: toView(build, written.notice) };
  const state = withNextQuestion(written.state);
  await saveBuild(ctx.sellerId, build.id, { state });
  return { view: toView({ ...build, state }, written.notice) };
}
