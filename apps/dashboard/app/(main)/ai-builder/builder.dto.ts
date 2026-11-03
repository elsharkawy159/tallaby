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
} as const;
export type BuilderFeature = (typeof BUILDER_FEATURES)[keyof typeof BUILDER_FEATURES];

/** The cost study's limits (docs/ai-store-builder-cost-study.md §9, accepted by the owner). */
export const BUILDER_LIMITS = {
  products: 25,
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
};

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
  z.object({ role: z.literal("assistant"), key: z.string() }),
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

/** `store_builds.state`. Read through parseBuilderState, so a stored row can't break the page. */
export const builderStateSchema = z.object({
  /** True when the account's free build was used before this one: it runs on credits. */
  paid: z.boolean().default(false),
  name: z.string().nullable().default(null),
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
};

export type BuilderItemStatus = "pending" | "done" | "failed" | "skipped";

export type BuilderProgress = { done: number; total: number; current: string | null };

export type BuilderIssue = {
  /** A key under `aiBuilder.issues`. */
  code: string;
  params?: Record<string, string | number>;
  href?: string;
};

export type BuilderReview = {
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
  z.object({ action: z.literal("removeProduct"), productId: z.string().max(40) }).strict(),
  z.object({ action: z.literal("removePhoto"), productId: z.string().max(40), path: z.string().max(300) }).strict(),
]);

export const builderBuildBodySchema = z
  .object({ action: z.enum(["step", "regenerate", "activate"]), buildId: z.string().uuid() })
  .strict();
