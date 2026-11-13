import { toWhatsAppNumber } from "@workspace/ui/lib/contact";

/**
 * The WhatsApp message Admin sends a seller from the sellers list and the
 * seller page (owner, 2026-11-08). It follows the step the seller stopped at
 * and speaks the seller's dialect. Pure: the facts come from
 * seller-message.server.ts.
 *
 * Owner, 2026-11-13: short and human, like a person on the team texting; it
 * never asks for money (no wallet top-up, no fee), one emoji at most, no
 * "مرحباً" opener and no separate team signature.
 */

/** The owner signs these messages. */
export const SELLER_MESSAGE_SENDER = "عمر";

/** Where the seller stopped: the first open setup step, or "ready" when both are done. */
export type SellerMessageStep = "template" | "product" | "ready";

/**
 * The seller activation rule (ROADMAP.md F-68/F-76): "active" once a top-up
 * succeeded or the balance was ever above zero, or on Pro, or while the USD
 * switch is off; "pending" when a manual top-up waits for review. The message
 * only uses "pending", to acknowledge a top-up the seller already sent.
 */
export type SellerActivation = "needed" | "pending" | "active";

export type MessageCountry = "EG" | "SA" | "AE" | "KW" | "QA" | "BH" | "OM" | "JO" | "PS" | "LB" | "SY";
export type MessageDialect = "eg" | "sa" | "gulf" | "levant" | "msa";

const COUNTRY_DIALECT: Record<MessageCountry, MessageDialect> = {
  EG: "eg",
  SA: "sa",
  AE: "gulf",
  KW: "gulf",
  QA: "gulf",
  BH: "gulf",
  OM: "gulf",
  JO: "levant",
  PS: "levant",
  LB: "levant",
  SY: "levant",
};

/** A store selling in one of these (F-61b) is taken to be in that country. EGP is the default, so it says nothing. */
const STORE_CURRENCY_COUNTRY: Partial<Record<string, MessageCountry>> = {
  SAR: "SA",
  AED: "AE",
  KWD: "KW",
  QAR: "QA",
  BHD: "BH",
  OMR: "OM",
};

/** Dialing codes, longest first. */
const DIALING_CODES: Array<[string, MessageCountry]> = [
  ["966", "SA"],
  ["971", "AE"],
  ["965", "KW"],
  ["974", "QA"],
  ["973", "BH"],
  ["968", "OM"],
  ["962", "JO"],
  ["970", "PS"],
  ["961", "LB"],
  ["963", "SY"],
  ["20", "EG"],
];

/** The country of a phone number, from its dialing code; null when unknown or not a number. */
export function countryFromPhone(phone: string | null | undefined): MessageCountry | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  return DIALING_CODES.find(([code]) => number.startsWith(code))?.[1] ?? null;
}

/**
 * The seller's country, from what Tallaby stores (there is no country column):
 *   1. the primary store's selling currency (F-61b), when it is a Gulf currency;
 *   2. the dialing code of the first valid phone (owner's, then the support line);
 *   3. no usable phone at all and the store sells in EGP: Egypt;
 *   4. otherwise null (unknown): Modern Standard Arabic.
 */
export function resolveMessageCountry(input: {
  storeCurrency: string | null | undefined;
  phones: Array<string | null | undefined>;
}): MessageCountry | null {
  const byCurrency = input.storeCurrency ? STORE_CURRENCY_COUNTRY[input.storeCurrency] : undefined;
  if (byCurrency) return byCurrency;
  const phone = input.phones.find((value) => toWhatsAppNumber(value) !== null);
  if (phone) return countryFromPhone(phone);
  return !input.storeCurrency || input.storeCurrency === "EGP" ? "EG" : null;
}

export const dialectFor = (country: MessageCountry | null): MessageDialect =>
  country ? COUNTRY_DIALECT[country] : "msa";

/** The first open setup step, in the dashboard checklist's order (template, then product). */
export function sellerMessageStep(facts: { templateChosen: boolean; hasActiveProduct: boolean }): SellerMessageStep {
  if (!facts.templateChosen) return "template";
  if (!facts.hasActiveProduct) return "product";
  return "ready";
}

/** Same rule as `orderLockState` (packages/lib/src/billing/order-lock.lib.ts), for many sellers at once. */
export function sellerMessageActivation(facts: {
  usdLive: boolean;
  isPro: boolean;
  hasTopUp: boolean;
  hasHadPositiveBalance: boolean;
  hasPendingTopUp: boolean;
}): SellerActivation {
  if (!facts.usdLive || facts.isPro || facts.hasTopUp || facts.hasHadPositiveBalance) return "active";
  return facts.hasPendingTopUp ? "pending" : "needed";
}

/** The first word of the owner's name, else null. */
export const firstName = (name: string | null | undefined): string | null => name?.trim().split(/\s+/)[0] || null;

type Copy = {
  /** The opener; carries the message's only emoji and says who is writing. */
  hello: (name: string | null) => string;
  /** Template and product steps: the seller opened a store. */
  opened: (store: string) => string;
  /** Ready step: checking in on a finished store. */
  checkIn: (store: string) => string;
  /** Choose a template; choosing one publishes the store (F-84: public from day one). */
  template: string;
  /** One line after the template step: products come next. */
  productNext: string;
  /** Add the first product, in two short lines. */
  product: [string, string];
  /** The store is published and public: share its link. */
  liveNow: (link: string) => string;
  /** Acknowledges a manual top-up the seller already sent; never asks for one. */
  pending: string;
  closing: string;
};

const TEMPLATE_PATH = "«المتجر الإلكتروني» ← «القوالب»";
const PRODUCT_PATH = "«المنتجات» ← «إضافة منتج»";
const ADD_MODES = "«إضافة يدويًا» أو «إضافة بالذكاء الاصطناعي»";
const SENDER = SELLER_MESSAGE_SENDER;

const EG: Copy = {
  hello: (name) => `أهلاً${name ? ` يا ${name}` : ""} 👋 أنا ${SENDER} من طلبي.`,
  opened: (store) => `شفت إنك فتحت متجرك «${store}»، مبروك!`,
  checkIn: (store) => `حبيت أطمّن عليك وعلى متجرك «${store}».`,
  template: `اختار قالب لمتجرك من ${TEMPLATE_PATH}، وتقدر تعاين أي قالب قبل ما تختاره. أول ما تختاره متجرك هيبقى أونلاين.`,
  productNext: `وبعدها ضيف منتجاتك من ${PRODUCT_PATH}.`,
  product: [
    `فاضل تضيف أول منتج: ادخل ${PRODUCT_PATH} واختار ${ADD_MODES}.`,
    "اكتب الاسم والسعر وارفع الصور، وبعدها اضغط «نشر المنتج».",
  ],
  liveNow: (link) => `متجرك أونلاين، شارك لينكه مع عملائك وعلى صفحاتك على السوشيال ميديا:\n${link}`,
  pending: "وطلب الشحن اللي بعته وصلنا، وبنراجعه دلوقتي.",
  closing: "لو محتاج أي حاجة كلمني هنا.",
};

const SA: Copy = {
  hello: (name) => `هلا${name ? ` ${name}` : ""} 👋 معك ${SENDER} من طلبي.`,
  opened: (store) => `ألف مبروك على متجرك «${store}»!`,
  checkIn: (store) => `حبيت أطمّن عليك وعلى متجرك «${store}».`,
  template: `اختر قالب لمتجرك من ${TEMPLATE_PATH}، وتقدر تعاين أي قالب قبل ما تختاره. وأول ما تختاره يصير متجرك أونلاين.`,
  productNext: `وبعدها ضيف منتجاتك من ${PRODUCT_PATH}.`,
  product: [
    `باقي تضيف أول منتج: ادخل ${PRODUCT_PATH} واختر ${ADD_MODES}.`,
    "اكتب الاسم والسعر وارفع الصور، وبعدها اضغط «نشر المنتج».",
  ],
  liveNow: (link) => `متجرك الحين أونلاين، شارك رابطه مع عملائك وفي حساباتك على السوشيال ميديا:\n${link}`,
  pending: "وطلب الشحن اللي أرسلته وصلنا، وقاعدين نراجعه.",
  closing: "إذا احتجت أي شي كلمني هنا.",
};

/** UAE, Kuwait, Qatar, Bahrain, Oman: a neutral Gulf variant (no Saudi-only words). */
const GULF: Copy = {
  ...SA,
  closing: "لو احتجت أي شي كلمني هنا.",
};

/** Jordan, Palestine, Lebanon, Syria. */
const LEVANT: Copy = {
  hello: (name) => `أهلين${name ? ` ${name}` : ""} 👋 معك ${SENDER} من طلبي.`,
  opened: (store) => `شفت إنك فتحت متجرك «${store}»، مبروك!`,
  checkIn: (store) => `حبيت اطمّن عليك وعلى متجرك «${store}».`,
  template: `اختار قالب لمتجرك من ${TEMPLATE_PATH}، وفيك تعاين أي قالب قبل ما تختاره. وأول ما تختاره بيصير متجرك أونلاين.`,
  productNext: `وبعدها ضيف منتجاتك من ${PRODUCT_PATH}.`,
  product: [
    `ضايل تضيف أول منتج: فوت على ${PRODUCT_PATH} واختار ${ADD_MODES}.`,
    "اكتب الاسم والسعر وارفع الصور، وبعدين اكبس «نشر المنتج».",
  ],
  liveNow: (link) => `متجرك هلأ أونلاين، شارك رابطه مع زباينك وعلى صفحاتك بالسوشيال ميديا:\n${link}`,
  pending: "وطلب الشحن يلي بعتّه وصلنا، وعم نراجعه.",
  closing: "إذا بدك أي شي احكيني هون.",
};

/** Friendly Modern Standard Arabic, for a country we can't tell. */
const MSA: Copy = {
  hello: (name) => `أهلاً${name ? ` ${name}` : ""} 👋 معك ${SENDER} من طلبي.`,
  opened: (store) => `مبروك على متجرك «${store}»!`,
  checkIn: (store) => `أحببت أن أطمئن عليك وعلى متجرك «${store}».`,
  template: `اختر قالبًا لمتجرك من ${TEMPLATE_PATH}، ويمكنك معاينة أي قالب قبل اختياره. وبمجرد اختياره يصبح متجرك متاحًا على الإنترنت.`,
  productNext: `بعدها أضف منتجاتك من ${PRODUCT_PATH}.`,
  product: [
    `بقي أن تضيف أول منتج: افتح ${PRODUCT_PATH} واختر ${ADD_MODES}.`,
    "اكتب الاسم والسعر وارفع الصور، ثم اضغط «نشر المنتج».",
  ],
  liveNow: (link) => `متجرك متاح الآن على الإنترنت، شارك رابطه مع عملائك وعلى حساباتك في وسائل التواصل:\n${link}`,
  pending: "ووصلنا طلب الشحن الذي أرسلته، ونراجعه الآن.",
  closing: "إن احتجت أي شيء راسلني هنا.",
};

const COPY: Record<MessageDialect, Copy> = { eg: EG, sa: SA, gulf: GULF, levant: LEVANT, msa: MSA };

export type SellerMessageInput = {
  dialect: MessageDialect;
  /** The owner's name (first word is used); null = no name. */
  ownerName: string | null;
  /** The primary store's name, else the business name. */
  storeName: string;
  /** The primary store's public URL when its website is published, else null. */
  storeLink: string | null;
  step: SellerMessageStep;
  activation: SellerActivation;
};

/**
 * The full message: a greeting, the next step (or a check-in with the store
 * link), and a one-line closing, separated by blank lines. Since F-84
 * (2026-11-09) a published store is public from day one, so the link is
 * shared from the product step on.
 */
export function buildSellerWhatsAppMessage(input: SellerMessageInput): string {
  const c = COPY[input.dialect];
  const link = input.step === "template" ? null : input.storeLink;
  const intro = input.step === "ready" ? c.checkIn(input.storeName) : c.opened(input.storeName);
  const blocks: string[] = [`${c.hello(firstName(input.ownerName))}\n${intro}`];

  if (input.step === "template") blocks.push(`${c.template}\n${c.productNext}`);
  else if (input.step === "product") blocks.push(c.product.join("\n"));
  if (link) blocks.push(c.liveNow(link));
  if (input.activation === "pending") blocks.push(c.pending);

  blocks.push(c.closing);
  return blocks.join("\n\n");
}
