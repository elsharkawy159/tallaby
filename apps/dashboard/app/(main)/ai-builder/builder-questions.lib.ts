import { STORE_INDUSTRIES } from "@workspace/store-editor/lib/industries.lib";
import { formatPhone, toLatinDigits } from "@workspace/store-sections/social";
import {
  BUILDER_LIMITS,
  OTHER_INDUSTRY,
  type BuilderAnswerValue,
  type BuilderErrorCode,
  type BuilderFileProblem,
  type BuilderQuestion,
  type BuilderQuestionCard,
  type BuilderQuestionOption,
  type BuilderRound,
  type BuilderState,
} from "./builder.dto";
import { matchIndustry, productsProblem } from "./builder.lib";

/**
 * The v2 conversation (ROADMAP.md F-82e; spec 2026-11-08 §4.3): which round
 * the seller is in, the questions of its card, and reading a whole card of
 * answers. Pure and code-only: every question and option label is an i18n key
 * (`aiBuilder.v2.*`); the only values the model ever supplies are the store
 * name ideas, already cleaned (builder-intake.lib.ts). At most 3 questions a
 * card; a round with more shows them over two cards. A seller who gave
 * everything in the hero sees only the design and selling cards.
 */

/** Same list as `TEMPLATE_STYLES` (a test keeps them equal), here so this file loads no templates. */
export const BUILDER_STYLES = ["luxe", "bold", "warm", "minimal", "playful", "classic"] as const;
export type BuilderStyle = (typeof BUILDER_STYLES)[number];

export const QUESTION_IDS = [
  "describe",
  "storeName",
  "industry",
  "color",
  "style",
  "template",
  "products",
  "productsDone",
  "fileFix",
  "shipping",
  "returns",
  "whatsapp",
  "build",
] as const;
export type QuestionId = (typeof QUESTION_IDS)[number];

/** Return windows offered, the first recommended (D8: 14 days). */
export const RETURN_CHOICES = [14, 7, 3] as const;
/** "Show 3 more" stops after this many templates. */
export const MAX_TEMPLATES_SHOWN = 12;
const MAX_CARD = 3;
const MAX_STYLES = 2;
const HEX = /^#[0-9a-f]{6}$/i;

const question = (id: QuestionId, kind: BuilderQuestion["kind"], options: BuilderQuestionOption[], extra: Partial<BuilderQuestion> = {}): BuilderQuestion => ({
  id,
  key: id,
  kind,
  options,
  allowOther: false,
  optional: false,
  ...extra,
});

const markFirst = (options: BuilderQuestionOption[]) => options.map((option, index) => (index === 0 ? { ...option, recommended: true } : option));

// ── What is still missing ───────────────────────────────────────────────────

export function fileProblems(state: Pick<BuilderState, "fileRows">): BuilderFileProblem[] {
  const out: BuilderFileProblem[] = [];
  for (const row of state.fileRows) {
    const missing: BuilderFileProblem["missing"] = [];
    if (row.price === null) missing.push("price");
    if (row.stock === null && !row.unlimited) missing.push("stock");
    if (missing.length) out.push({ row: row.row, name: row.name, missing });
  }
  return out;
}

const productsReady = (state: BuilderState) => (state.fileRows.length ? state.fileReviewed || fileProblems(state).length === 0 : state.productsDone);

function brandQuestions(state: BuilderState): BuilderQuestion[] {
  const out: BuilderQuestion[] = [];
  if (!state.name) {
    out.push(question("storeName", "single", markFirst(state.nameIdeas.map((idea) => ({ value: idea, label: idea }))), { allowOther: true }));
  }
  if (!state.industryId) {
    const known = new Set(STORE_INDUSTRIES.map((industry) => industry.id));
    const picks = state.industryOptions.filter((id) => known.has(id)).slice(0, 3);
    // A value is a STORE_INDUSTRIES id: the client shows its own Arabic or English name.
    const options = markFirst((picks.length ? picks : STORE_INDUSTRIES.slice(0, 3).map((i) => i.id)).map((id) => ({ value: id })));
    out.push(question("industry", "single", [...options, { value: OTHER_INDUSTRY, key: "industryOther" }], { allowOther: true }));
  }
  if (!state.colorDone) {
    const logo = state.logoColors.filter((color) => HEX.test(color)).slice(0, 3);
    const options: BuilderQuestionOption[] = [...logo.map((color) => ({ value: color, key: "logoColor", color })), { value: "template", key: "templateColors" }];
    out.push(question("color", "color", markFirst(options), { allowOther: true }));
  }
  if (!state.styleDone) {
    out.push(question("style", "multi", BUILDER_STYLES.map((style) => ({ value: style, key: `style_${style}` })), { optional: true, maxChoices: MAX_STYLES }));
  }
  return out;
}

function productsQuestions(state: BuilderState): BuilderQuestion[] {
  if (state.fileRows.length) {
    if (state.fileReviewed || !fileProblems(state).length) return [];
    // The client shows the rows (`view.fileProblems`) as a table with inline fixes; this moves on.
    return [question("fileFix", "single", [{ value: "continue", key: "fileContinue", recommended: true }])];
  }
  if (state.productsDone) return [];
  if (!state.productsChoice) {
    return [
      question("products", "single", [
        { value: "file", key: "productsFile", recommended: true },
        { value: "photos", key: "productsPhotos" },
        { value: "type", key: "productsType" },
        { value: "none", key: "productsNone" },
      ]),
    ];
  }
  // The uploader (file) or the product form (photos, type) shows above this.
  return [question("productsDone", "single", [{ value: "done", key: "productsDoneNow", recommended: true }, { value: "back", key: "productsBack" }])];
}

function sellingQuestions(state: BuilderState): BuilderQuestion[] {
  const out: BuilderQuestion[] = [];
  if (!state.shipping) {
    out.push(
      question(
        "shipping",
        "single",
        [
          { value: "tallaby_rates", key: "shippingTallaby", recommended: true },
          { value: "cairo_giza", key: "shippingCairoGiza" },
          { value: "egypt_flat", key: "shippingFlat", needsText: true },
        ],
        { allowOther: true, optional: true },
      ),
    );
  }
  if (!state.returns) {
    out.push(
      question(
        "returns",
        "single",
        [...markFirst(RETURN_CHOICES.map((days) => ({ value: `days:${days}`, key: "returnsDays", params: { days } }))), { value: "none", key: "returnsNone" }],
        { allowOther: true, optional: true },
      ),
    );
  }
  if (!state.contact.whatsapp && !("whatsapp" in state.answers)) {
    const same = state.contact.phone ? [{ value: "same", key: "whatsappSame", params: { phone: state.contact.phone }, recommended: true }] : [];
    out.push(question("whatsapp", "text", same, { allowOther: true, optional: true }));
  }
  return out;
}

/** Where the conversation is: the first round with something to ask. */
export function currentRound(state: BuilderState): BuilderRound {
  if (!state.intakeDone) return "describe";
  if (brandQuestions(state).length) return "brand";
  if (!state.templateKey) return "design";
  if (!productsReady(state)) return "products";
  if (sellingQuestions(state).length) return "selling";
  return "summary";
}

function roundQuestions(state: BuilderState, round: BuilderRound): BuilderQuestion[] {
  switch (round) {
    case "describe":
      return [question("describe", "text", [], { allowOther: true })];
    case "brand":
      return brandQuestions(state);
    case "design":
      // Scored in code on the server (`withShortlistV2`); the first is recommended.
      return [question("template", "templates", markFirst(state.shortlist.map((key) => ({ value: key }))))];
    case "products":
      return productsQuestions(state);
    case "selling":
      return sellingQuestions(state);
    case "summary":
      return [question("build", "single", [{ value: "build", key: "buildNow", recommended: true }])];
  }
}

/** The card to answer now: at most 3 questions of the current round. */
export function nextCard(state: BuilderState): BuilderQuestionCard {
  const round = currentRound(state);
  return { round, key: round, questions: roundQuestions(state, round).slice(0, MAX_CARD) };
}

/** Saves the card on the state and, when it is a new round, says so in the chat (an i18n key). */
export function withCard(state: BuilderState): BuilderState {
  const card = nextCard(state);
  const key = `v2.cards.${card.round}`;
  const last = [...state.messages].reverse().find((message) => message.role === "assistant");
  const messages = last?.role === "assistant" && last.key === key ? state.messages : [...state.messages, { role: "assistant" as const, key }];
  return { ...state, pendingQuestions: card, messages };
}

// ── Reading a card ──────────────────────────────────────────────────────────

export type CardResult =
  | { kind: "ok"; state: BuilderState }
  | { kind: "error"; error: BuilderErrorCode; question?: QuestionId }
  /** The seller described the store (dashboard start): read it with `store_builder_intake`. */
  | { kind: "describe"; state: BuilderState; text: string }
  /** "Build and publish": the seller's consent (D1). */
  | { kind: "build"; state: BuilderState };

type Applied = { state: BuilderState } | { error: BuilderErrorCode } | { describe: string } | { build: true };

const clip = (value: string | undefined, max: number) => (value ?? "").replace(/\s+/g, " ").trim().slice(0, max).trim();
const bad: Applied = { error: "invalidAnswer" };

function applyOne(state: BuilderState, id: QuestionId, answer: BuilderAnswerValue): Applied {
  const text = clip(answer.text, BUILDER_LIMITS.textMax);
  const choice = answer.choice;
  switch (id) {
    case "describe":
      return text.length >= 3 ? { describe: text } : bad;
    case "storeName": {
      const name = choice && state.nameIdeas.includes(choice) ? choice : text;
      return name.length >= 2 && name.length <= 80 ? { state: { ...state, name } } : bad;
    }
    case "industry": {
      if (choice && STORE_INDUSTRIES.some((industry) => industry.id === choice)) return { state: { ...state, industryId: choice } };
      if (choice === OTHER_INDUSTRY && !text) return { state: { ...state, industryId: OTHER_INDUSTRY } };
      if (text) return { state: { ...state, industryId: matchIndustry(text) ?? OTHER_INDUSTRY, about: state.about ?? text } };
      return bad;
    }
    case "color": {
      if (choice === "template") return { state: { ...state, primaryColor: null, colorDone: true } };
      const hex = (choice && state.logoColors.includes(choice) ? choice : text).toLowerCase();
      return HEX.test(hex) ? { state: { ...state, primaryColor: hex, colorDone: true } } : bad;
    }
    case "style": {
      if (answer.skip) return { state: { ...state, styleDone: true } };
      const styles = (answer.choices ?? (choice ? [choice] : [])).filter((s): s is BuilderStyle => (BUILDER_STYLES as readonly string[]).includes(s)).slice(0, MAX_STYLES);
      return styles.length ? { state: { ...state, styles, styleDone: true } } : bad;
    }
    case "template":
      return choice && state.shortlist.includes(choice) ? { state: { ...state, templateKey: choice } } : bad;
    case "products": {
      if (choice === "none") return { state: { ...state, productsChoice: "none", productsDone: true } };
      return choice === "file" || choice === "photos" || choice === "type" ? { state: { ...state, productsChoice: choice } } : bad;
    }
    case "productsDone": {
      if (choice === "back") return { state: { ...state, productsChoice: null } };
      if (choice !== "done") return bad;
      // Typed or photographed products need the seller's own price and stock (they can't be made without).
      if (state.products.length) {
        const problem = productsProblem(state.products);
        if (problem) return { error: problem };
      }
      return { state: { ...state, productsDone: true } };
    }
    case "fileFix":
      return choice === "continue" ? { state: { ...state, fileReviewed: true } } : bad;
    case "shipping": {
      if (answer.skip) return { state: { ...state, shipping: { mode: "skip" } } };
      if (choice === "tallaby_rates" || choice === "cairo_giza") return { state: { ...state, shipping: { mode: "template", template: choice } } };
      if (choice === "egypt_flat") {
        const price = Number(toLatinDigits(text).replace(/[^\d.]/g, ""));
        if (!text || !Number.isFinite(price) || price < 0 || price > 10_000) return bad;
        return { state: { ...state, shipping: { mode: "template", template: "egypt_flat", price } } };
      }
      if (text.length >= 3 && text.length <= BUILDER_LIMITS.shippingTextMax) return { state: { ...state, shipping: { mode: "text", text } } };
      return text.length > BUILDER_LIMITS.shippingTextMax ? { error: "tooLong" } : bad;
    }
    case "returns": {
      if (answer.skip) return { state: { ...state, returns: { kind: "skip" } } };
      if (choice === "none") return { state: { ...state, returns: { kind: "none" } } };
      const days = RETURN_CHOICES.find((value) => `days:${value}` === choice);
      if (days) return { state: { ...state, returns: { kind: "days", days } } };
      return text.length >= 3 ? { state: { ...state, returns: { kind: "text", text } } } : bad;
    }
    case "whatsapp": {
      if (answer.skip) return { state };
      if (choice === "same" && state.contact.phone) return { state: { ...state, contact: { ...state.contact, whatsapp: state.contact.phone } } };
      const phone = text ? formatPhone(text) : null;
      return phone ? { state: { ...state, contact: { ...state.contact, whatsapp: phone } } } : { error: "needPhone" };
    }
    case "build":
      return choice === "build" ? { build: true } : bad;
  }
}

/**
 * A whole card of answers, by question id. Only questions on the card the
 * code would show now count (an old card, or an id the client made up, is
 * ignored). Nothing is saved if any answer is wrong; a question left out stays
 * on the next card.
 */
export function applyCardAnswers(state: BuilderState, answers: Readonly<Record<string, BuilderAnswerValue>>): CardResult {
  const card = nextCard(state);
  let next = state;
  let answered = 0;
  for (const q of card.questions) {
    const answer = answers[q.id];
    if (!answer) continue;
    if (answer.skip && !q.optional) return { kind: "error", error: "invalidAnswer", question: q.id as QuestionId };
    const applied = applyOne(next, q.id as QuestionId, answer);
    if ("error" in applied) return { kind: "error", error: applied.error, question: q.id as QuestionId };
    if ("describe" in applied) return { kind: "describe", state: { ...next, about: applied.describe }, text: applied.describe };
    if ("build" in applied) return { kind: "build", state: next };
    next = { ...applied.state, answers: { ...applied.state.answers, [q.id]: answer } };
    answered++;
  }
  return answered ? { kind: "ok", state: next } : { kind: "error", error: "invalidAnswer" };
}

/** A label the seller's chat bubble shows for a card they answered (i18n key + values; the client renders it). */
export function answerSummary(answers: Readonly<Record<string, BuilderAnswerValue>>): string {
  return Object.entries(answers)
    .map(([id, answer]) => (answer.skip ? `${id}:skip` : answer.choices?.length ? `${id}:${answer.choices.join("+")}` : answer.choice ? `${id}:${answer.choice}` : `${id}:text`))
    .join(" ")
    .slice(0, 300);
}
