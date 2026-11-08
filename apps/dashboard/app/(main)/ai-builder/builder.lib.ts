import { STORE_INDUSTRIES, templatesForIndustry } from "@workspace/store-editor/lib/industries.lib";
import { SOCIAL_PLATFORM_KEYS, formatPhone, normalizeSocialLink, toLatinDigits } from "@workspace/store-sections/social";
import {
  BUILDER_LIMITS,
  OTHER_INDUSTRY,
  RETURN_DAYS,
  type BuilderAnswer,
  type BuilderChatOutput,
  type BuilderErrorCode,
  type BuilderIssue,
  type BuilderItemStatus,
  type BuilderProduct,
  type BuilderReturns,
  type BuilderState,
  type BuilderStep,
} from "./builder.dto";

/**
 * The AI Store Builder's conversation and rules in code (ROADMAP.md F-54c/d):
 * which question comes next, reading answers, what the model may fill in, the
 * spend stop and the review list. Pure, so each rule has a test. The model only
 * reads free text into a small state; it never decides what happens next.
 */

const clip = (value: string | null | undefined, max: number) => (value ?? "").replace(/[ \t]+/g, " ").trim().slice(0, max).trim();

// ── Questions ───────────────────────────────────────────────────────────────

/** The first question not answered yet. Earlier answers skip later questions, and a resumed build lands in the right place. */
export function currentStep(state: BuilderState): BuilderStep {
  if (!state.name) return "name";
  if (state.about === null) return "about";
  if (!state.industryId) return "industry";
  if (!state.contact.phone) return "contact";
  if (!state.socialDone) return "social";
  if (!state.briefConfirmed) return "brief";
  if (!state.logoDone) return "logo";
  if (!state.templateKey) return "template";
  if (!state.productsDone) return "products";
  if (!state.shipping) return "shipping";
  if (!state.returns) return "returns";
  return "summary";
}

/** Appends the next question, unless the seller is already looking at it. */
export function withNextQuestion(state: BuilderState): BuilderState {
  const key = currentStep(state);
  const last = [...state.messages].reverse().find((message) => message.role === "assistant");
  if (last?.role === "assistant" && last.key === key) return state;
  return { ...state, messages: [...state.messages, { role: "assistant", key }] };
}

const MAX_MESSAGES = 200;

export function withSellerMessage(state: BuilderState, text: string): BuilderState {
  // The latest ones are enough to resume; the state holds the answers.
  return { ...state, messages: [...state.messages, { role: "seller" as const, text: clip(text, BUILDER_LIMITS.textMax) }].slice(-MAX_MESSAGES) };
}

export type AnswerResult =
  | { kind: "ok"; state: BuilderState }
  | { kind: "error"; error: BuilderErrorCode }
  /** The text needs the model: read it into the state, then ask the next question. */
  | { kind: "read"; state: BuilderState; text: string }
  /** The seller asked for changes to the brief card: write it again. */
  | { kind: "rewriteBrief"; state: BuilderState }
  /** The seller confirmed the card: take the free claim (or use credits). */
  | { kind: "confirmBrief" }
  /** The seller started the build. */
  | { kind: "build" };

const text = (answer: BuilderAnswer) => (answer.type === "text" ? answer.text.trim() : "");

/** Applies one answer to the current question. */
export function applyAnswer(state: BuilderState, answer: BuilderAnswer): AnswerResult {
  const step = currentStep(state);
  const typed = text(answer);
  if (answer.type === "text" && typed.length > BUILDER_LIMITS.textMax) return { kind: "error", error: "tooLong" };
  const chip = answer.type === "chip" ? answer.value : null;

  switch (step) {
    case "name": {
      if (typed.length < 2 || typed.length > 80) return { kind: "error", error: "invalidAnswer" };
      return { kind: "ok", state: { ...state, name: typed } };
    }
    case "about": {
      if (typed.length < 3) return { kind: "error", error: "invalidAnswer" };
      return { kind: "read", state: { ...state, about: typed }, text: typed };
    }
    case "industry": {
      const known = STORE_INDUSTRIES.find((industry) => industry.id === chip);
      if (known) return { kind: "ok", state: { ...state, industryId: known.id } };
      if (chip === OTHER_INDUSTRY) return { kind: "ok", state: { ...state, industryId: OTHER_INDUSTRY } };
      const matched = typed ? matchIndustry(typed) : null;
      return matched ? { kind: "ok", state: { ...state, industryId: matched } } : { kind: "error", error: "invalidAnswer" };
    }
    case "contact": {
      const contact = readContact(typed);
      if (!contact.phone) return { kind: "error", error: "needPhone" };
      return { kind: "ok", state: { ...state, contact: { ...state.contact, ...contact } } };
    }
    case "social": {
      if (answer.type === "skip") return { kind: "ok", state: { ...state, socialDone: true } };
      const links = readSocialLinks(typed);
      if (!links.length) return { kind: "error", error: "invalidAnswer" };
      return { kind: "ok", state: { ...state, social: mergeSocial(state.social, links), socialDone: true } };
    }
    case "brief": {
      if (chip === "confirm" && state.brief) return { kind: "confirmBrief" };
      if (!typed) return { kind: "error", error: "invalidAnswer" };
      return { kind: "rewriteBrief", state: { ...state, briefNote: typed } };
    }
    case "logo": {
      // The upload route sets the logo; here the seller only moves on without one.
      if (answer.type === "skip") return { kind: "ok", state: { ...state, logoDone: true } };
      return { kind: "error", error: "invalidAnswer" };
    }
    case "template": {
      if (chip && state.shortlist.includes(chip)) return { kind: "ok", state: { ...state, templateKey: chip } };
      return { kind: "error", error: "invalidAnswer" };
    }
    case "products": {
      if (chip === "done") {
        const problem = productsProblem(state.products);
        return problem ? { kind: "error", error: problem } : { kind: "ok", state: { ...state, productsDone: true } };
      }
      if (typed.length < 2) return { kind: "error", error: "invalidAnswer" };
      if (state.products.length >= BUILDER_LIMITS.products) return { kind: "error", error: "tooManyProducts" };
      return { kind: "read", state, text: typed };
    }
    case "shipping":
      return applyShippingAnswer(state, answer);
    case "returns": {
      const returns = readReturnsAnswer(answer);
      return returns ? { kind: "ok", state: { ...state, returns } } : { kind: "error", error: "invalidAnswer" };
    }
    case "summary":
      return chip === "build" ? { kind: "build" } : { kind: "error", error: "invalidAnswer" };
  }
}

function applyShippingAnswer(state: BuilderState, answer: BuilderAnswer): AnswerResult {
  if (answer.type === "skip") return { kind: "ok", state: { ...state, shipping: { mode: "skip" }, shippingAwaitingPrice: false } };
  if (answer.type === "chip") {
    if (answer.value === "egypt_flat") return { kind: "ok", state: { ...state, shippingAwaitingPrice: true } };
    if (answer.value === "tallaby_rates" || answer.value === "cairo_giza") {
      return { kind: "ok", state: { ...state, shipping: { mode: "template", template: answer.value }, shippingAwaitingPrice: false } };
    }
    return { kind: "error", error: "invalidAnswer" };
  }
  const typed = answer.text.trim();
  if (state.shippingAwaitingPrice) {
    const price = Number(toLatinDigits(typed).replace(/[^\d.]/g, ""));
    if (!typed || !Number.isFinite(price) || price < 0 || price > 10_000) return { kind: "error", error: "invalidAnswer" };
    return { kind: "ok", state: { ...state, shipping: { mode: "template", template: "egypt_flat", price }, shippingAwaitingPrice: false } };
  }
  if (typed.length < 3) return { kind: "error", error: "invalidAnswer" };
  if (typed.length > BUILDER_LIMITS.shippingTextMax) return { kind: "error", error: "tooLong" };
  return { kind: "ok", state: { ...state, shipping: { mode: "text", text: typed } } };
}

function readReturnsAnswer(answer: BuilderAnswer): BuilderReturns | null {
  if (answer.type === "skip") return { kind: "skip" };
  if (answer.type === "chip") {
    if (answer.value === "none") return { kind: "none" };
    const days = RETURN_DAYS.find((value) => `days:${value}` === answer.value);
    return days ? { kind: "days", days } : null;
  }
  const typed = answer.text.trim();
  return typed.length >= 3 ? { kind: "text", text: typed } : null;
}

// ── Products ────────────────────────────────────────────────────────────────

/** Why the seller can't move on from products yet. Prices and stock are the seller's own, never assumed. */
export function productsProblem(products: readonly BuilderProduct[]): BuilderErrorCode | null {
  if (!products.length) return "needProducts";
  const ready = products.every((product) => product.price !== null && product.price > 0 && (product.unlimited || product.stock !== null));
  return ready ? null : "needPrices";
}

/** Every number written in a text, with Arabic digits and thousands separators handled. */
export function numbersInText(value: string): number[] {
  const matches = toLatinDigits(value).replace(/(\d)[,،٬](?=\d{3}\b)/g, "$1").match(/\d+(?:\.\d+)?/g) ?? [];
  return matches.map(Number);
}

const stated = (value: number | null, numbers: readonly number[]) => (value !== null && numbers.includes(value) ? value : null);

/** The model's Latin store name, kept only when the seller wrote it (letters, digits, spaces, & . ' -; at most 40). */
export function latinNameInText(nameEn: string | null, sellerText: string): string | null {
  const name = (nameEn ?? "").replace(/\s+/g, " ").trim();
  if (!name || name.length > 40 || !/^[A-Za-z0-9][A-Za-z0-9 &.'-]*$/.test(name) || !/[A-Za-z]/.test(name)) return null;
  return sellerText.toLowerCase().replace(/\s+/g, " ").includes(name.toLowerCase()) ? name : null;
}

/**
 * The model's answer → the state. Defence on top of the prompt: a phone,
 * price or stock count is kept only when that number is in the seller's text,
 * a link only when that link is, and existing answers are never replaced.
 */
/**
 * The model's phone, WhatsApp, email and links, each kept only when it is in
 * the seller's own text (shared by the chat reading and the v2 intake reading).
 */
export function verifiedContact(
  output: Pick<BuilderChatOutput, "phone" | "whatsapp" | "email" | "socialLinks">,
  sellerText: string,
): { contact: BuilderState["contact"]; links: BuilderState["social"] } {
  const lowered = sellerText.toLowerCase();
  const digits = toLatinDigits(sellerText).replace(/\D/g, "");
  const inText = (phone: string | null) => {
    const found = phone ? toLatinDigits(phone).replace(/\D/g, "") : "";
    return found.length >= 8 && digits.includes(found.replace(/^(20|0)/, "")) ? formatPhone(phone!) : null;
  };
  const email = output.email && lowered.includes(output.email.toLowerCase()) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(output.email) ? output.email : null;
  const links = readSocialLinks(output.socialLinks.filter((link) => lowered.includes(link.toLowerCase())).join(" "));
  return { contact: { phone: inText(output.phone), whatsapp: inText(output.whatsapp), email }, links };
}

export function mergeReading(state: BuilderState, output: BuilderChatOutput, sellerText: string, newId: () => string): BuilderState {
  const numbers = numbersInText(sellerText);
  const { contact: found, links } = verifiedContact(output, sellerText);

  const free = Math.max(0, BUILDER_LIMITS.products - state.products.length);
  const known = new Set(state.products.map((product) => product.name.toLowerCase()));
  const products: BuilderProduct[] = [];
  for (const raw of output.products) {
    const name = clip(raw.name, 120);
    if (!name || known.has(name.toLowerCase()) || products.length >= free) continue;
    known.add(name.toLowerCase());
    const price = stated(raw.price, numbers);
    const compareAt = stated(raw.compareAtPrice, numbers);
    const stock = stated(raw.stock, numbers);
    products.push({
      id: newId(),
      name,
      details: clip(raw.details, BUILDER_LIMITS.textMax),
      price: price !== null && price > 0 ? price : null,
      compareAtPrice: compareAt !== null && price !== null && compareAt > price ? compareAt : null,
      stock: stock !== null && Number.isInteger(stock) ? stock : null,
      unlimited: false,
      photos: [],
    });
  }

  return {
    ...state,
    nameEn: state.nameEn ?? latinNameInText(output.nameEn, sellerText),
    industrySuggestion: state.industryId ? state.industrySuggestion : (matchIndustry(`${output.industryHint ?? ""} ${state.about ?? ""}`) ?? state.industrySuggestion),
    contact: {
      phone: state.contact.phone ?? found.phone,
      whatsapp: state.contact.whatsapp ?? found.whatsapp,
      email: state.contact.email ?? found.email,
    },
    social: mergeSocial(state.social, links),
    socialDone: state.socialDone || links.length > 0,
    products: [...state.products, ...products],
  };
}

// ── Answers read in code ────────────────────────────────────────────────────

const EMAIL_RE = /[^\s@،,]+@[^\s@،,]+\.[^\s@،,]+/;

/** Phone numbers, WhatsApp and email from one answer, no model. The first number is the phone; a labelled one is WhatsApp. */
export function readContact(value: string): BuilderState["contact"] {
  const latin = toLatinDigits(value);
  const email = latin.match(EMAIL_RE)?.[0] ?? null;
  const rest = email ? latin.replace(email, " ") : latin;
  const numbers = (rest.match(/\+?\d[\d\s-]{6,}\d/g) ?? []).map((raw) => ({ raw, phone: formatPhone(raw) })).filter((n) => n.phone);
  const labelled = numbers.find((n) => new RegExp(`(whats\\s?app|واتس|واتساب)[^\\d+]{0,12}${n.raw.replace(/[+]/g, "\\+")}`, "i").test(rest));
  const plain = numbers.find((n) => n !== labelled);
  return { phone: plain?.phone ?? labelled?.phone ?? null, whatsapp: labelled?.phone ?? null, email };
}

const hostOf = (raw: string) => {
  try {
    return new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

/** Links for platforms we know. A link must land on the same site it was written for, so a bare word is never read as a handle. */
export function readSocialLinks(value: string): { platform: string; value: string }[] {
  const out: { platform: string; value: string }[] = [];
  for (const token of value.split(/[\s,،]+/).filter((part) => part.includes("."))) {
    const host = hostOf(token);
    for (const platform of SOCIAL_PLATFORM_KEYS) {
      const url = normalizeSocialLink(platform, token);
      if (!url || hostOf(url) !== host) continue;
      if (!out.some((link) => link.platform === platform)) out.push({ platform, value: url });
      break;
    }
  }
  return out;
}

const mergeSocial = (current: BuilderState["social"], links: BuilderState["social"]) => [
  ...current,
  ...links.filter((link) => !current.some((existing) => existing.platform === link.platform)),
];

const ARABIC_FOLD: Record<string, string> = { أ: "ا", إ: "ا", آ: "ا", ة: "ه", ى: "ي" };
const tokens = (value: string) =>
  value
    .toLowerCase()
    .replace(/[أإآةى]/g, (char) => ARABIC_FOLD[char] ?? char)
    .split(/[^\p{L}\p{N}]+/u)
    .map((word) => word.replace(/^ال(?=\S{3})/, ""))
    .filter((word) => word.length >= 3);

/** The store industry a text is closest to, matched in code (docs/ai.md: no catalogs in prompts). Null when nothing fits. */
export function matchIndustry(value: string): string | null {
  return rankIndustries(value)[0]?.id ?? null;
}

/**
 * Every industry the text matches, best first (a name word counts 3, a search
 * word 1). Ties keep the list's order, so `matchIndustry` picks as before.
 */
export function rankIndustries(value: string): { id: string; score: number }[] {
  const words = new Set(tokens(value));
  const scored: { id: string; score: number; index: number }[] = [];
  STORE_INDUSTRIES.forEach((industry, index) => {
    const score =
      tokens(`${industry.en} ${industry.ar}`).filter((word) => words.has(word)).length * 3 +
      tokens(industry.queries.join(" ")).filter((word) => words.has(word)).length;
    if (score > 0) scored.push({ id: industry.id, score, index });
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map(({ id, score }) => ({ id, score }));
}

/** Sure enough to skip the question: a name word matched and nothing else scores as high. */
export function industryIsConfident(ranked: readonly { score: number }[]): boolean {
  const [top, second] = ranked;
  return Boolean(top && top.score >= 3 && (!second || top.score > second.score));
}

/** A small stable hash, so a seller's shortlist doesn't reorder on resume. */
const hash = (value: string) => [...value].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);

export type TemplateForShortlist = { key: string; category: string; name: { ar?: string; en?: string }; description: { ar?: string; en?: string } };

/** Three templates, chosen in code: the store's industry (else related ones), then style words, then a stable shuffle. */
export function shortlistTemplates(templates: readonly TemplateForShortlist[], industryId: string | null, styleWords: readonly string[], seed: string): string[] {
  const wanted = new Set(styleWords.flatMap((word) => tokens(word)));
  const pool = templatesForIndustry(templates, industryId === OTHER_INDUSTRY ? null : industryId);
  return pool
    .map((template) => ({
      key: template.key,
      score: tokens(`${template.name.en ?? ""} ${template.description.en ?? ""}`).filter((word) => wanted.has(word)).length,
      order: hash(`${seed}:${template.key}`),
    }))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, 3)
    .map((template) => template.key);
}

/** A subdomain to try: the store's Latin name. Empty when there's nothing Latin to use. */
export function subdomainBase(nameEn: string | null | undefined, name: string | null | undefined): string {
  for (const value of [nameEn, name]) {
    const slug = (value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "");
    if (slug.length >= 3) return slug;
  }
  return "";
}

const SHIPPING_GROUP_NAMES = {
  egypt_flat: [{ nameAr: "كل مصر", nameEn: "All Egypt" }],
  cairo_giza: [{ nameAr: "القاهرة والجيزة", nameEn: "Cairo and Giza" }],
} as const;

/** Zone names per template group: template groups come with no names (`templateZones`). */
export function shippingZoneNames(template: "tallaby_rates" | "egypt_flat" | "cairo_giza", groups: number): { nameAr: string; nameEn: string }[] {
  if (template !== "tallaby_rates") return [...SHIPPING_GROUP_NAMES[template]];
  return Array.from({ length: groups }, (_, i) => ({ nameAr: `منطقة ${i + 1}`, nameEn: `Zone ${i + 1}` }));
}

// ── Spend ───────────────────────────────────────────────────────────────────

/** May one more model call run? Stops early enough that a fallback to the smart model still stays under the stop. */
export function canSpend(spentMicroUsd: number, limit: number = BUILDER_LIMITS.hardStopMicroUsd, margin: number = BUILDER_LIMITS.callMarginMicroUsd): boolean {
  return spentMicroUsd + margin < limit;
}

/** The platform's daily budget in micro-USD, from env. Anything unusable falls back to the study's $25. */
export function platformBudgetMicroUsd(raw: string | undefined): number {
  const usd = Number(raw);
  return Math.round((raw !== undefined && raw !== "" && Number.isFinite(usd) && usd >= 0 ? usd : BUILDER_LIMITS.platformDailyBudgetUsd) * 1_000_000);
}

// ── Build steps ─────────────────────────────────────────────────────────────

export type BuildItem = { key: string; status: BuilderItemStatus; attempts: number; data: Record<string, unknown>; productId: string | null };

export const MAX_ITEM_ATTEMPTS = 2;

/** Every step of a build, in order. Finishing them all makes the store ready for review. */
export function buildItemKeys(state: Pick<BuilderState, "products"> & Partial<Pick<BuilderState, "flow" | "fileRows">>): string[] {
  const products = state.products.map((product) => `product:${product.id}`);
  if (state.flow !== "v2") return ["store", "settings", "template", "site_copy", ...products, "catalog", "shipping", "policy", "notes"];
  const batches = Array.from({ length: Math.ceil(fileRowsToAdd(state.fileRows ?? []).length / BUILDER_LIMITS.fileBatch) }, (_, n) => `products_file:${n}`);
  return ["store", "settings", "template", "brand", "categories", "site_copy", "hero_photos", ...batches, ...products, "catalog", "shipping", "policy", "checks", "publish"];
}

/** The file rows a build adds: those with a price (a row without one waits for the seller's fix, D4), in file order. */
export function fileRowsToAdd<T extends { price: number | null }>(rows: readonly T[]): T[] {
  return rows.filter((row) => row.price !== null && row.price > 0).slice(0, BUILDER_LIMITS.fileProducts);
}

/** The rows of one `products_file:<n>` step. */
export function fileBatchRows<T extends { price: number | null }>(rows: readonly T[], batch: number): T[] {
  return fileRowsToAdd(rows).slice(batch * BUILDER_LIMITS.fileBatch, (batch + 1) * BUILDER_LIMITS.fileBatch);
}

export const isFinished = (status: BuilderItemStatus | undefined) => status === "done" || status === "failed" || status === "skipped";

export function nextBuildItem(keys: readonly string[], items: ReadonlyMap<string, Pick<BuildItem, "status">>): string | null {
  return keys.find((key) => !isFinished(items.get(key)?.status)) ?? null;
}

export function buildProgress(keys: readonly string[], items: ReadonlyMap<string, Pick<BuildItem, "status">>) {
  return { done: keys.filter((key) => isFinished(items.get(key)?.status)).length, total: keys.length, current: nextBuildItem(keys, items) };
}

// ── Review ──────────────────────────────────────────────────────────────────

export type ReviewSnapshot = {
  storeId: string | null;
  state: Pick<BuilderState, "products" | "logo" | "returns" | "shipping">;
  items: ReadonlyMap<string, Pick<BuildItem, "status" | "data" | "productId">>;
  products: { id: string; hasPhoto: boolean }[];
  zoneCount: number;
  returnPolicy: string | null;
  invalidPages: number;
};

/** What's still missing, code only. Each entry links to the page that fixes it. */
export function reviewIssues(snapshot: ReviewSnapshot): BuilderIssue[] {
  const { storeId, state, items, products } = snapshot;
  const issues: BuilderIssue[] = [];
  if (!storeId) return [{ code: "noStore", href: "/stores" }];
  const store = `/stores/${storeId}`;

  const notBuilt = state.products.filter((product) => items.get(`product:${product.id}`)?.status !== "done");
  for (const product of notBuilt) issues.push({ code: "productNotBuilt", params: { name: product.name }, href: "/products/add" });
  const noPhoto = products.filter((product) => !product.hasPhoto).length;
  if (noPhoto) issues.push({ code: "productsWithoutPhoto", params: { count: noPhoto }, href: "/products" });

  const siteCopy = items.get("site_copy")?.status;
  if (siteCopy !== "done") issues.push({ code: "siteCopyMissing", href: `${store}/editor` });
  if (snapshot.invalidPages) issues.push({ code: "pagesInvalid", params: { count: snapshot.invalidPages }, href: `${store}/editor` });
  if (!state.logo) issues.push({ code: "noLogo", href: `${store}/settings` });

  const shipping = items.get("shipping");
  const unmatched = (shipping?.data.unmatched as string[] | undefined) ?? [];
  if (unmatched.length) issues.push({ code: "placesNotRecognised", params: { places: unmatched.slice(0, 5).join("، ") }, href: `${store}/shipping` });
  if (state.shipping?.mode !== "skip" && shipping?.status !== "done") issues.push({ code: "shippingNotSet", href: `${store}/shipping` });
  else if (state.shipping?.mode !== "skip" && !snapshot.zoneCount) issues.push({ code: "shippingNotSet", href: `${store}/shipping` });

  if (!snapshot.returnPolicy?.trim()) issues.push({ code: "noReturnPolicy", href: "/settings" });
  return issues;
}

// ── Review, v2 (F-82j) ──────────────────────────────────────────────────────

/** Why a product the build made stayed a draft (D4): its photo, its stock answer, or a name to check. */
export type DraftReason = "photo" | "stock" | "name";

export type ReviewSnapshotV2 = ReviewSnapshot & {
  state: Pick<BuilderState, "products" | "logo" | "returns" | "shipping" | "fileRows">;
  /** Every product the build made, live or not. */
  built: { id: string; live: boolean; missing: DraftReason[] }[];
  published: boolean;
  publishError: string | null;
  activationLocked: boolean;
  /** Code-gate findings of the `checks` step. */
  flags: { code: string; count: number }[];
  /** File rows a batch could not add (failed, or left when spending stopped). */
  fileNotAdded: number;
};

/**
 * The to-do list of a v2 build, code only, most important first: the account
 * step, the site, then products (zero products leads, D3), then the rest.
 */
export function reviewIssuesV2(snapshot: ReviewSnapshotV2): BuilderIssue[] {
  const { storeId, state, items, built } = snapshot;
  if (!storeId) return [{ code: "noStore", href: "/stores" }];
  const store = `/stores/${storeId}`;
  const issues: BuilderIssue[] = [];

  if (snapshot.activationLocked) issues.push({ code: "activationNeeded", href: "/wallet/top-up" });
  if (!snapshot.published) issues.push({ code: "publishFailed", href: `${store}/website` });

  const noPrice = state.fileRows.filter((row) => row.price === null).length;
  if (!built.length && !noPrice) issues.push({ code: "addFirstProduct", href: "/products/add" });
  if (noPrice) issues.push({ code: "fileRowsNoPrice", params: { count: noPrice }, href: "/products/add" });
  if (snapshot.fileNotAdded) issues.push({ code: "fileProductsNotAdded", params: { count: snapshot.fileNotAdded }, href: "/products/add/from-file" });
  for (const product of state.products) {
    if (items.get(`product:${product.id}`)?.status !== "done") issues.push({ code: "productNotBuilt", params: { name: product.name }, href: "/products/add" });
  }
  const drafts = built.filter((product) => !product.live);
  const count = (reason: DraftReason) => drafts.filter((product) => product.missing.includes(reason)).length;
  if (count("photo")) issues.push({ code: "productsWithoutPhoto", params: { count: count("photo") }, href: "/products" });
  if (count("stock")) issues.push({ code: "productsWithoutStock", params: { count: count("stock") }, href: "/products" });
  if (count("name")) issues.push({ code: "productsToCheck", params: { count: count("name") }, href: "/products" });

  if (items.get("site_copy")?.status !== "done") issues.push({ code: "siteCopyMissing", href: `${store}/editor` });
  if (snapshot.invalidPages) issues.push({ code: "pagesInvalid", params: { count: snapshot.invalidPages }, href: `${store}/editor` });
  for (const flag of snapshot.flags) if (flag.count > 0) issues.push({ code: flag.code, params: { count: flag.count }, href: `${store}/editor` });
  if (!state.logo) issues.push({ code: "noLogo", href: `${store}/settings` });

  const shipping = items.get("shipping");
  const unmatched = (shipping?.data.unmatched as string[] | undefined) ?? [];
  if (unmatched.length) issues.push({ code: "placesNotRecognised", params: { places: unmatched.slice(0, 5).join("، ") }, href: `${store}/shipping` });
  if (state.shipping?.mode !== "skip" && (shipping?.status !== "done" || !snapshot.zoneCount)) issues.push({ code: "shippingNotSet", href: `${store}/shipping` });
  if (!snapshot.returnPolicy?.trim()) issues.push({ code: "noReturnPolicy", href: "/settings" });
  return issues;
}
