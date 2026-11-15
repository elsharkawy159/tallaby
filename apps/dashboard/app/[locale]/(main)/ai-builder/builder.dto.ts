import { z } from "zod";

/**
 * AI Store Builder (ROADMAP.md F-54; design note:
 * docs/superpowers/specs/2026-11-03-ai-store-builder-design.md): the saved
 * conversation, the limits and what each route answers. Safe for the client.
 */

/** One usage-log feature per step, so Admin › AI usage shows each (docs/ai.md rule 11). */
export const BUILDER_FEATURES = {
  chat: "store_builder_chat",
  brief: "store_builder_brief",
  product: "store_builder_product",
  siteCopy: "store_builder_site_copy",
  shipping: "store_builder_shipping",
  policies: "store_builder_policies",
  review: "store_builder_review",
  /** v2 (F-82e): one reading of the hero intake (prompt, file headers, logo, colour). Free like chat, capped. */
  intake: "store_builder_intake",
} as const;
export type BuilderFeature = (typeof BUILDER_FEATURES)[keyof typeof BUILDER_FEATURES];

/** The cost study's limits (docs/ai-store-builder-cost-study.md §9, accepted by the owner). */
export const BUILDER_LIMITS = {
  /** Products from photos or typed in the chat (v1 path, D5). */
  products: 25,
  /** Products from a file, with AI copy (D5). */
  fileProducts: 150,
  /** Rows of a file one build step adds (`products_file:<n>`, the importer's batch). */
  fileBatch: 10,
  photos: 100,
  photosPerProduct: 4,
  /** Chat turns that use the model. Forms and chips never count. */
  chatTurns: 40,
  /** Full site copy runs after the first. */
  siteCopyRegenerations: 2,
  hardStopMicroUsd: 400_000,
  /** What one more call could cost if it fell back to the smart model. */
  callMarginMicroUsd: 30_000,
  /** Billed on every model call, shown with a counter. */
  textMax: 1500,
  shippingTextMax: 800,
  maxImageBytes: 1.5 * 1024 * 1024,
  briefRuns: 3,
  freeBuildsPerIpPerDay: 3,
  buildsPerDay: 5,
  platformDailyBudgetUsd: 25,
} as const;

/** Most calls a seller may make of one feature per Cairo day (docs/ai.md rule 11). Never the real limit of a build. */
export const BUILDER_DAILY_CAPS: Record<BuilderFeature, number> = {
  store_builder_chat: 60,
  store_builder_brief: 10,
  store_builder_product: 60,
  store_builder_site_copy: 10,
  store_builder_shipping: 10,
  store_builder_policies: 10,
  store_builder_review: 10,
  store_builder_intake: 10,
};

/** Model calls a paid build never takes a credit for: reading the seller's words (capped by turns and the daily cap). */
export const BUILDER_FREE_FEATURES: ReadonlySet<BuilderFeature> = new Set<BuilderFeature>(["store_builder_chat", "store_builder_intake"]);

export const BUILDER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const BUILDER_STEPS = ["name", "about", "industry", "contact", "social", "brief", "logo", "template", "products", "shipping", "returns", "summary"] as const;
export type BuilderStep = (typeof BUILDER_STEPS)[number];

/** Chips that aren't in another list. */
export const RETURN_DAYS = [3, 7, 14, 30] as const;
export const OTHER_INDUSTRY = "other";

const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  details: z.string().default(""),
  price: z.number().nullable().default(null),
  compareAtPrice: z.number().nullable().default(null),
  stock: z.number().nullable().default(null),
  unlimited: z.boolean().default(false),
  /** Paths in the "products" bucket, under this seller's folder. */
  photos: z.array(z.string()).default([]),
});
export type BuilderProduct = z.output<typeof productSchema>;

const messageSchema = z.union([
  z.object({ role: z.literal("seller"), text: z.string() }),
  /** The text is an i18n key: the model never writes what the seller reads here. */
  z.object({ role: z.literal("assistant"), key: z.string(), params: z.record(z.string(), z.union([z.string(), z.number()])).optional() }),
]);
export type BuilderMessage = z.output<typeof messageSchema>;

const briefSchema = z.object({
  nameEn: z.string(),
  taglineAr: z.string(),
  taglineEn: z.string(),
  audience: z.string(),
  tone: z.string(),
  styleWords: z.array(z.string()),
});
export type BuilderBrief = z.output<typeof briefSchema>;

const shippingSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("template"), template: z.enum(["tallaby_rates", "egypt_flat", "cairo_giza"]), price: z.number().optional() }),
  z.object({ mode: z.literal("text"), text: z.string() }),
  z.object({ mode: z.literal("skip") }),
]);
export type BuilderShipping = z.output<typeof shippingSchema>;

const returnsSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("days"), days: z.number() }),
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("text"), text: z.string() }),
  z.object({ kind: z.literal("skip") }),
]);
export type BuilderReturns = z.output<typeof returnsSchema>;

/**
 * One product row of the seller's file, compact (F-82f): what the build needs
 * and nothing else, capped at `BUILDER_LIMITS.fileProducts`. Money in integer
 * piastres (rule 7). Prices and stock only ever come from the file or the
 * seller's own fix, never from a model.
 */
export const builderFileRowSchema = z.object({
  /** The sheet row number the seller sees. */
  row: z.number().int().min(1).max(20_000),
  name: z.string().max(200),
  /** The English name when the file has its own English column. */
  nameEn: z.string().max(200).nullable().default(null),
  /** What a customer pays, in piastres. Null: the file gave none; the row is not added until the seller fixes it. */
  price: z.number().int().positive().nullable().default(null),
  /** The higher price before an offer, in piastres. */
  compareAt: z.number().int().positive().nullable().default(null),
  stock: z.number().int().min(0).nullable().default(null),
  unlimited: z.boolean().default(false),
  /** Public https photo links (at most 3). */
  images: z.array(z.string().max(2000)).max(3).default([]),
  category: z.string().max(80).nullable().default(null),
  description: z.string().max(600).nullable().default(null),
  sku: z.string().max(100).nullable().default(null),
});
export type BuilderFileRow = z.output<typeof builderFileRowSchema>;

export const builderFileSummarySchema = z.object({
  /** Rows the file had with anything in them. */
  found: z.number().int().min(0),
  /** Rows kept (at most `fileProducts`). */
  kept: z.number().int().min(0),
  missingPrice: z.number().int().min(0),
  missingStock: z.number().int().min(0),
  /** Rows dropped: no name, a bad SKU, repeats. */
  dropped: z.number().int().min(0),
  /** Rows over the limit: left for the file importer. */
  truncated: z.number().int().min(0),
  /** How the columns were read. */
  mapping: z.enum(["template", "dictionary", "ai", "fallback"]),
});
export type BuilderFileSummary = z.output<typeof builderFileSummarySchema>;

/** One answer to one question of a card (F-82e). */
export const builderAnswerValueSchema = z
  .object({
    choice: z.string().max(80).optional(),
    choices: z.array(z.string().max(80)).max(6).optional(),
    text: z.string().max(1500).optional(),
    skip: z.boolean().optional(),
  })
  .strict();
export type BuilderAnswerValue = z.output<typeof builderAnswerValueSchema>;

const questionOptionSchema = z.object({
  value: z.string(),
  /** An i18n key under `aiBuilder.v2.options`; else `label` is a cleaned value (a name idea). */
  key: z.string().optional(),
  label: z.string().optional(),
  params: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
  recommended: z.boolean().optional(),
  /** Colour options: the swatch. */
  color: z.string().optional(),
  /** This choice needs a typed value too (the one price for all Egypt). */
  needsText: z.boolean().optional(),
});
export type BuilderQuestionOption = z.output<typeof questionOptionSchema>;

export const BUILDER_QUESTION_KINDS = ["single", "multi", "text", "color", "templates"] as const;

const questionSchema = z.object({
  id: z.string(),
  /** An i18n key under `aiBuilder.v2.questions`: the model never writes a question. */
  key: z.string(),
  kind: z.enum(BUILDER_QUESTION_KINDS),
  options: z.array(questionOptionSchema),
  /** "Other…": a typed answer is accepted. */
  allowOther: z.boolean(),
  /** Skip is offered. */
  optional: z.boolean(),
  maxChoices: z.number().optional(),
});
export type BuilderQuestion = z.output<typeof questionSchema>;

export const BUILDER_ROUNDS = ["describe", "brand", "design", "products", "selling", "summary"] as const;
export type BuilderRound = (typeof BUILDER_ROUNDS)[number];

const questionCardSchema = z.object({
  round: z.enum(BUILDER_ROUNDS),
  /** An i18n key under `aiBuilder.v2.cards`. */
  key: z.string(),
  questions: z.array(questionSchema).max(3),
});
export type BuilderQuestionCard = z.output<typeof questionCardSchema>;

/** `store_builds.state`. Read through parseBuilderState, so a stored row can't break the page. */
export const builderStateSchema = z.object({
  /** v1: the 2026-11-03 question list (rows saved before v2). v2: intake, then question cards (F-82e). */
  flow: z.enum(["v1", "v2"]).default("v1"),
  /** True when the account's free build was used before this one: it runs on credits. */
  paid: z.boolean().default(false),
  name: z.string().nullable().default(null),
  /** The store's Latin name, kept only when the seller wrote it (mergeReading). */
  nameEn: z.string().nullable().default(null),
  about: z.string().nullable().default(null),
  industryId: z.string().nullable().default(null),
  industrySuggestion: z.string().nullable().default(null),
  contact: z
    .object({ phone: z.string().nullable().default(null), whatsapp: z.string().nullable().default(null), email: z.string().nullable().default(null) })
    .default({ phone: null, whatsapp: null, email: null }),
  social: z.array(z.object({ platform: z.string(), value: z.string() })).default([]),
  socialDone: z.boolean().default(false),
  brief: briefSchema.nullable().default(null),
  briefRuns: z.number().default(0),
  briefNote: z.string().nullable().default(null),
  briefConfirmed: z.boolean().default(false),
  logo: z.string().nullable().default(null),
  logoDone: z.boolean().default(false),
  shortlist: z.array(z.string()).default([]),
  templateKey: z.string().nullable().default(null),
  products: z.array(productSchema).default([]),
  productsDone: z.boolean().default(false),
  /** Photos ever accepted. Removing one doesn't give the slot back, so the limit can't be churned. */
  photosUsed: z.number().default(0),
  shipping: shippingSchema.nullable().default(null),
  /** Waiting for the one price of "one price for all Egypt". */
  shippingAwaitingPrice: z.boolean().default(false),
  returns: returnsSchema.nullable().default(null),
  messages: z.array(messageSchema).default([]),

  // ── v2 (F-82e, F-82f) ─────────────────────────────────────────────────────
  /** The hero intake this build came from. */
  intakeId: z.string().nullable().default(null),
  /**
   * The intake has a product file the browser hasn't read yet (F-82i): the
   * client fetches a short-lived signed link (`intakeFileLink`), reads it with
   * the importer's browser parser and sends the rows (`attachFile`). The
   * server never parses an untrusted spreadsheet.
   */
  intakeFilePending: z.boolean().default(false),
  source: z.enum(["hero", "dashboard"]).default("dashboard"),
  /** The intake reading ran (or there was nothing to read): the cards start. */
  intakeDone: z.boolean().default(false),
  /** Store names the model suggested when the seller gave none (cleaned, at most 3). */
  nameIdeas: z.array(z.string()).default([]),
  /** The code's best industries for the seller's words, best first (at most 3), when it isn't sure. */
  industryOptions: z.array(z.string()).default([]),
  /** The seller's brand colour, `#rrggbb`. Null: the template's own colours. */
  primaryColor: z.string().nullable().default(null),
  /** Asked and answered (a colour, or "the template's colours"). */
  colorDone: z.boolean().default(false),
  /** The logo's main colours, read in the browser (at most 3). */
  logoColors: z.array(z.string()).default([]),
  /** Template styles (`TEMPLATE_STYLES`) the seller picked or the code read from their words. */
  styles: z.array(z.string()).default([]),
  styleDone: z.boolean().default(false),
  /** English stock-photo keywords for the hero and about photos (D7). */
  photoKeywordsEn: z.array(z.string()).default([]),
  /** Names this file's SKUs (`importSku`): fixed per build and file, so a batch run twice adds nothing twice. */
  fileKey: z.string().nullable().default(null),
  fileRows: z.array(builderFileRowSchema).default([]),
  fileSummary: builderFileSummarySchema.nullable().default(null),
  /** The seller saw the rows missing a price or stock and moved on. */
  fileReviewed: z.boolean().default(false),
  /** How the seller adds products when there was no file: file | photos | type | none. */
  productsChoice: z.enum(["file", "photos", "type", "none"]).nullable().default(null),
  /** Each question answered, by id (what the seller chose or typed). */
  answers: z.record(z.string(), builderAnswerValueSchema).default({}),
  /** The card the seller is looking at, built in code (builder-questions.lib.ts). */
  pendingQuestions: questionCardSchema.nullable().default(null),
  /** Every template key shown so far ("show 3 more" never repeats one). */
  templatesShown: z.array(z.string()).default([]),

  // ── Niche editions (ROADMAP F-90, plan §4.5) ───────────────────────────────
  /**
   * What the store sells in a few English words: the intake reading's
   * `industryHint`, kept (it was read for the industry and then dropped). The
   * code passes it to `matchNiche` as its hint; no field was added to any
   * model output for it.
   */
  tradeHint: z.string().max(40).nullable().default(null),
  /**
   * The store's niche when the shortlist was last made (`builderNiche`, code
   * only). A shortlisted template that has this niche's edition is previewed
   * and installed with it; it is checked again whenever it is used.
   */
  nicheId: z.string().max(63).nullable().default(null),
});
export type BuilderState = z.output<typeof builderStateSchema>;

export function parseBuilderState(raw: unknown): BuilderState {
  const parsed = builderStateSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : builderStateSchema.parse({});
}

// ── What the model returns ──────────────────────────────────────────────────
// Flat and nullable on purpose: Gemini structured output has a complexity limit.
// Everything is checked again in code (builder.lib.ts), including that a price
// or a phone number really is in the seller's text.

export const builderChatOutputSchema = z.object({
  nameEn: z.string().nullable().describe("The store name in Latin letters, only if the seller wrote one. Else null."),
  industryHint: z.string().nullable().describe("What the store sells, in plain English, 1 to 4 words. Null if unclear."),
  phone: z.string().nullable().describe("A phone number written in the text. Else null."),
  whatsapp: z.string().nullable().describe("A number the text says is for WhatsApp. Else null."),
  email: z.string().nullable().describe("An email written in the text. Else null."),
  socialLinks: z.array(z.string()).describe("Social media links written in the text, exactly as written."),
  products: z
    .array(
      z.object({
        name: z.string().describe("The product's name as written."),
        details: z.string().describe("Anything else the text says about this product, as written. Else empty."),
        price: z.number().nullable().describe("Its price in EGP, only if written. Else null."),
        compareAtPrice: z.number().nullable().describe("The higher price before a discount, only if written. Else null."),
        stock: z.number().nullable().describe("How many are available, only if written. Else null."),
      }),
    )
    .describe("Each product the text names, in order. Empty if it names none."),
});
export type BuilderChatOutput = z.output<typeof builderChatOutputSchema>;

/**
 * `store_builder_chat` in v2: what the seller types between the cards ("change
 * the colour to green", "the store is called Oud", a few products). Code turns
 * it into state changes (`applyEditReading`); a colour is a word code looks up,
 * never a value the model invents.
 */
export const builderEditOutputSchema = builderChatOutputSchema.extend({
  storeName: z.string().nullable().describe("The store name, only if the seller asks to name or rename the store, exactly as written. Else null."),
  colorWord: z.string().nullable().describe("The brand colour the seller asks for, as one English colour word (green, navy, gold). Else null."),
  styleWords: z.array(z.string()).describe("Style words the seller asks for (luxury, modern, warm, minimal, playful, classic). Else empty."),
});
export type BuilderEditOutput = z.output<typeof builderEditOutputSchema>;

/**
 * `store_builder_intake` (F-82e): one reading of everything the seller gave.
 * Short and flat on purpose; every value is checked again in code
 * (builder-intake.lib.ts `cleanIntakeReading`): a name, phone, email or link is
 * kept only when it is in the seller's own text.
 */
const intakeFields = {
  storeNameAr: z.string().nullable().describe("The store's name exactly as the seller wrote it, only if stated. Else null."),
  storeNameEn: z.string().nullable().describe("The store's name in Latin letters, only if the seller wrote one. Else null."),
  industryHint: z.string().nullable().describe("What the store sells, in plain English, 1 to 4 words. Null if unclear."),
  audience: z.string().nullable().describe("Who the store is for, in Arabic, at most 80 characters, from the input only. Null if unclear."),
  tone: z.string().nullable().describe("The store's tone of voice, in Arabic, at most 60 characters."),
  styleWords: z.array(z.string()).describe("Up to 5 English style words for the look, such as luxury, modern, warm, minimal, playful, classic."),
  taglineAr: z.string().nullable().describe("A short Arabic tagline, at most 70 characters. No claims the input doesn't support."),
  taglineEn: z.string().nullable().describe("The same tagline in English, at most 70 characters."),
  photoKeywordsEn: z.array(z.string()).describe("Up to 5 English stock-photo search words for the products or mood. Objects and places only: no people, faces or hands."),
  phone: z.string().nullable().describe("A phone number written in the text. Else null."),
  whatsapp: z.string().nullable().describe("A number the text says is for WhatsApp. Else null."),
  email: z.string().nullable().describe("An email written in the text. Else null."),
  socialLinks: z.array(z.string()).describe("Social media links written in the text, exactly as written."),
};
export const builderIntakeOutputSchema = z.object(intakeFields);
const intakeColumn = z.number().int().nullable();
/** The same reading, plus the file's columns when the code can't read its headers itself (the `product_bulk_map` fields). */
export const builderIntakeWithMappingOutputSchema = z.object({
  ...intakeFields,
  mapping: z
    .object({
      name: intakeColumn.describe("Product name when one column holds it."),
      nameAr: intakeColumn.describe("Only a separate Arabic name column."),
      nameEn: intakeColumn.describe("Only a separate English name column."),
      description: intakeColumn.describe("Product description."),
      price: intakeColumn.describe("The selling price before any offer."),
      salePrice: intakeColumn.describe("The lower offer price."),
      cost: intakeColumn.describe("What the seller paid (cost, wholesale). Never the selling price."),
      stock: intakeColumn.describe("Quantity in stock."),
      sku: intakeColumn.describe("Item code, SKU or barcode."),
      category: intakeColumn.describe("Category or product type."),
      brand: intakeColumn.describe("Brand."),
      images: intakeColumn.describe("Links to product photos."),
    })
    .describe("Column index per field; null when the file has no such column."),
});
export type BuilderIntakeOutput = z.output<typeof builderIntakeOutputSchema> & {
  mapping?: z.output<typeof builderIntakeWithMappingOutputSchema>["mapping"];
};

export const builderBriefOutputSchema = z.object({
  nameEn: z.string().describe("The store name in Latin letters, at most 40 characters. Keep the seller's own if written; else transliterate it."),
  taglineAr: z.string().describe("A short Arabic tagline, at most 70 characters. No claims the input doesn't support."),
  taglineEn: z.string().describe("The same tagline in English, at most 70 characters."),
  audience: z.string().describe("Who the store is for, in Arabic, at most 80 characters, from the input only."),
  tone: z.string().describe("The store's tone of voice, in Arabic, at most 60 characters."),
  styleWords: z.array(z.string()).describe("3 to 5 English style words, such as minimal, warm, bold, luxury, playful."),
});

export const builderSiteCopyOutputSchema = z.object({
  values: z
    .array(z.object({ id: z.string().describe("The slot's id, unchanged."), ar: z.string(), en: z.string() }))
    .describe("One item per slot, each no longer than its slot's max."),
});
export type BuilderSiteCopyOutput = z.output<typeof builderSiteCopyOutputSchema>;

export const builderPolicyOutputSchema = z.object({
  returnPolicy: z.string().describe("The store's return and exchange policy as short plain text, at most 1200 characters. No markdown."),
});

export const builderReviewOutputSchema = z.object({
  notes: z.array(z.string()).describe("At most 5 short notes in Arabic about mixed languages or contradictions in the text. Empty if none."),
});

// ── What the routes answer ──────────────────────────────────────────────────

export type BuilderErrorCode =
  | "unauthorized"
  | "disabled"
  | "badInput"
  | "tooLong"
  | "invalidAnswer"
  | "needPhone"
  | "needProducts"
  | "needPrices"
  | "tooManyProducts"
  | "tooManyPhotos"
  | "badFile"
  | "tooLarge"
  | "uploadsLocked"
  | "turnLimit"
  | "dailyLimit"
  | "budget"
  | "noCredits"
  | "creditsNotLive"
  | "emailNotConfirmed"
  | "phoneUsed"
  | "ipLimit"
  | "platformBusy"
  | "tooManyBuilds"
  | "regenerateLimit"
  | "rateLimited"
  | "notBuilding"
  | "locked"
  | "busy"
  | "timeout"
  | "failed";

export type BuilderStatus = "collecting" | "building" | "review" | "abandoned";

export type BuilderTemplateChoice = {
  key: string;
  name: { ar?: string; en?: string };
  description: { ar?: string; en?: string };
  palette: string[];
  /** The niche edition this suggestion is previewed (`?edition=`) and installed with; null: the template's own content. */
  edition: { id: string; name: { ar: string; en: string } } | null;
};

/** A product photo or logo the client may show. */
export type BuilderView = {
  id: string;
  status: BuilderStatus;
  step: BuilderStep;
  state: BuilderState;
  free: boolean;
  chatTurns: number;
  storeId: string | null;
  /** Public URL per stored path, for thumbnails. */
  photoUrls: Record<string, string>;
  templates: BuilderTemplateChoice[];
  /** Set when a model step could not run: the chat tells the seller, nothing is lost. */
  notice: BuilderErrorCode | null;
  /** v2 (F-82e): the question flow. v1 builds keep `step`. */
  flow: "v1" | "v2";
  /** v2: where the conversation is. Null on v1. */
  round: BuilderRound | null;
  /** v2: the card to answer now (also `state.pendingQuestions`). */
  card: BuilderQuestionCard | null;
  /** v2: the logo's public URL, when there is one. */
  logoUrl: string | null;
  /** v2: file rows that can't go live as they are (no price: not added; no stock: draft), for the inline fix table. */
  fileProblems: BuilderFileProblem[];
  /** v2: "show 3 more" has more to show. */
  moreTemplates: boolean;
};

export type BuilderFileProblem = { row: number; name: string; missing: ("price" | "stock")[] };

export type BuilderItemStatus = "pending" | "done" | "failed" | "skipped";

export type BuilderProgress = { done: number; total: number; current: string | null };

export type BuilderIssue = {
  /** A key under `aiBuilder.issues`. */
  code: string;
  params?: Record<string, string | number>;
  href?: string;
};

export type BuilderReview = {
  flow: "v1" | "v2";
  storeId: string | null;
  storeName: string | null;
  subdomain: string | null;
  stopReason: string | null;
  issues: BuilderIssue[];
  notes: string[];
  products: { id: string; title: string; status: string; hasPhoto: boolean }[];
  draftProducts: number;
  regenerationsLeft: number;
  otherStoresShowAll: number;
  spentMicroUsd: number;
  /** v2: the build published the site (D1). */
  published: boolean;
  /** v2: the store's "View store" link: `/api/stores/<id>/view`. */
  viewUrl: string | null;
};

export type BuilderChatResponse = { ok: true; view: BuilderView } | { ok: false; error: BuilderErrorCode; view?: BuilderView };

export type BuilderBuildResponse =
  | { ok: true; view: BuilderView; progress: BuilderProgress; review: BuilderReview | null }
  | { ok: false; error: BuilderErrorCode };

/** Who sent the answer: typed text, a chip, or "skip this question". */
export type BuilderAnswer = { type: "text"; text: string } | { type: "chip"; value: string } | { type: "skip" };

export const builderProductInputSchema = z
  .object({
    id: z.string().max(40).optional(),
    name: z.string().trim().min(1).max(120),
    details: z.string().trim().max(BUILDER_LIMITS.textMax).default(""),
    price: z.number().positive().max(10_000_000).nullable(),
    compareAtPrice: z.number().positive().max(10_000_000).nullable().default(null),
    stock: z.number().int().min(0).max(1_000_000).nullable(),
    unlimited: z.boolean().default(false),
  })
  .strict();

export const builderChatBodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }).strict(),
  z.object({ action: z.literal("restart") }).strict(),
  z
    .object({
      action: z.literal("answer"),
      answer: z.union([
        z.object({ type: z.literal("text"), text: z.string().max(BUILDER_LIMITS.textMax * 2) }).strict(),
        z.object({ type: z.literal("chip"), value: z.string().max(80) }).strict(),
        z.object({ type: z.literal("skip") }).strict(),
      ]),
    })
    .strict(),
  z.object({ action: z.literal("saveProduct"), product: builderProductInputSchema }).strict(),
  /** v2: a whole question card in one request, by question id. */
  z.object({ action: z.literal("answers"), answers: z.record(z.string().max(40), builderAnswerValueSchema) }).strict(),
  /** v2: free text between the cards (an edit such as "change the colour to green"), read by `store_builder_chat`. */
  z.object({ action: z.literal("edit"), text: z.string().min(1).max(BUILDER_LIMITS.textMax) }).strict(),
  /** v2: the next 3 templates by score, never one shown already. */
  z.object({ action: z.literal("moreTemplates") }).strict(),
  /** v2: the logo's main colours, read in the browser (no model). */
  z.object({ action: z.literal("logoColors"), colors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(3) }).strict(),
  /** v2: a product file the browser read with the importer's own parser (`readSheetFile`): its header and rows of text. Checked again here. */
  z
    .object({
      action: z.literal("attachFile"),
      headers: z.array(z.string().max(80)).max(40),
      rows: z
        .array(z.object({ row: z.number().int().min(1).max(20_000), cells: z.array(z.string().max(2000)).max(40) }).strict())
        .min(1)
        .max(500),
    })
    .strict(),
  z.object({ action: z.literal("removeProduct"), productId: z.string().max(40) }).strict(),
  z.object({ action: z.literal("removePhoto"), productId: z.string().max(40), path: z.string().max(300) }).strict(),
]);

export const builderBuildBodySchema = z
  .object({ action: z.enum(["step", "regenerate", "activate"]), buildId: z.string().uuid() })
  .strict();
