import { FREE_ORDER_FEE_USD_CENTS, TOP_UP_MIN_USD_CENTS, usdCentsToPiastres } from "@workspace/lib/billing";
import { toWhatsAppNumber } from "@workspace/ui/lib/contact";

/**
 * The WhatsApp message Admin sends a seller from the sellers list and the
 * seller page (owner, 2026-11-08). It follows the step the seller stopped at
 * and speaks the seller's dialect with prices in their currency. Pure: the
 * facts and rates come from seller-message.server.ts.
 *
 * Kept local to Admin for now. apps/ecommerce/lib/marketing/local-currency.lib.ts
 * has a similar country → currency map for tallaby.com; the two may be merged later.
 */

/** The owner signs these messages. */
export const SELLER_MESSAGE_SENDER = "عمر";

/** Where the seller stopped: the first open setup step, or "ready" when both are done. */
export type SellerMessageStep = "template" | "product" | "ready";

/**
 * The seller activation rule (ROADMAP.md F-68/F-76): "active" once a top-up
 * succeeded or the balance was ever above zero, or on Pro, or while the USD
 * switch is off; "pending" when a manual top-up waits for review.
 */
export type SellerActivation = "needed" | "pending" | "active";

export type MessageCountry = "EG" | "SA" | "AE" | "KW" | "QA" | "BH" | "OM" | "JO" | "PS" | "LB" | "SY";
export type MessageDialect = "eg" | "sa" | "gulf" | "levant" | "msa";
/** The currency a message quotes prices in. */
export type MessageCurrency = "EGP" | "SAR" | "AED" | "KWD" | "QAR" | "BHD" | "OMR" | "JOD" | "USD";

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

/** Lebanon, Syria and Palestine are quoted in USD (their local rates are unreliable or split). */
const COUNTRY_CURRENCY: Record<MessageCountry, MessageCurrency> = {
  EG: "EGP",
  SA: "SAR",
  AE: "AED",
  KW: "KWD",
  QA: "QAR",
  BH: "BHD",
  OM: "OMR",
  JO: "JOD",
  PS: "USD",
  LB: "USD",
  SY: "USD",
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
 *   4. otherwise null (unknown): Modern Standard Arabic and USD.
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

export const currencyFor = (country: MessageCountry | null): MessageCurrency =>
  country ? COUNTRY_CURRENCY[country] : "USD";

/** The currencies other than EGP and USD a message may need a feed rate for. */
export const FEED_MESSAGE_CURRENCIES = ["SAR", "AED", "KWD", "QAR", "BHD", "OMR", "JOD"] as const;

export type MessageRates = {
  /** EGP per USD as the dashboard wallet uses it (getBillingState().marketRate); null = none. */
  egpPerUsd: number | null;
  taxEnabled: boolean;
  taxRateBps: number;
  /** USD→X from the exchange-rate feed, for FEED_MESSAGE_CURRENCIES; missing = show USD. */
  usd: Partial<Record<string, number>>;
};

const CURRENCY_WORD: Record<MessageCurrency, string> = {
  EGP: "جنيه",
  SAR: "ريال",
  AED: "درهم",
  KWD: "دينار كويتي",
  QAR: "ريال قطري",
  BHD: "دينار بحريني",
  OMR: "ريال عماني",
  JOD: "دينار أردني",
  USD: "دولار",
};

/** Currencies with 3 minor digits: a per-order fee needs the third one. */
const THREE_DECIMALS = new Set<MessageCurrency>(["KWD", "BHD", "OMR", "JOD"]);

const formatAmount = (value: number, maxDecimals: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: maxDecimals });

export type MessageMoney = {
  /** The minimum top-up, e.g. "270 جنيه" or "19 ريال (5 دولار)". */
  topUp: string;
  /** The Free plan's per-order fee, e.g. "1.62 جنيه". */
  fee: string;
  currency: MessageCurrency;
};

const usdMoney = (): MessageMoney => ({
  topUp: `${formatAmount(TOP_UP_MIN_USD_CENTS / 100, 2)} ${CURRENCY_WORD.USD}`,
  fee: `${formatAmount(FREE_ORDER_FEE_USD_CENTS / 100, 2)} ${CURRENCY_WORD.USD}`,
  currency: "USD",
});

/**
 * The minimum top-up ($5) and the per-order fee ($0.03) in `currency`.
 *
 * EGP uses the wallet's rate and maths: `usdCentsToPiastres` (rounds up), plus
 * the top-up tax when Admin turned it on, then up to a whole pound so the
 * seller never sends less than the minimum (the dashboard asks for the floor
 * of the same figure). The fee keeps piastres. Other currencies use the feed's
 * USD→X rate: the top-up rounded up to a whole unit with the dollar amount
 * beside it, the fee at the nearest 2 (or 3) decimals, never 0. No rate: USD.
 */
export function messageMoney(currency: MessageCurrency, rates: MessageRates): MessageMoney {
  if (currency === "EGP") {
    const rate = rates.egpPerUsd;
    if (!rate || !Number.isFinite(rate) || rate <= 0) return usdMoney();
    const base = usdCentsToPiastres(TOP_UP_MIN_USD_CENTS, rate);
    const tax = rates.taxEnabled ? Math.ceil((base * rates.taxRateBps) / 10_000) : 0;
    const topUpPounds = Math.ceil((base + tax) / 100);
    const feePounds = usdCentsToPiastres(FREE_ORDER_FEE_USD_CENTS, rate) / 100;
    return {
      topUp: `${formatAmount(topUpPounds, 0)} ${CURRENCY_WORD.EGP}`,
      fee: `${formatAmount(feePounds, 2)} ${CURRENCY_WORD.EGP}`,
      currency: "EGP",
    };
  }
  if (currency === "USD") return usdMoney();
  const rate = rates.usd[currency];
  if (!rate || !Number.isFinite(rate) || rate <= 0) return usdMoney();
  const decimals = THREE_DECIMALS.has(currency) ? 3 : 2;
  const topUp = Math.ceil((TOP_UP_MIN_USD_CENTS / 100) * rate - 1e-9);
  // Nearest minor unit, never 0: the same figure tallaby.com's pricing shows (local-currency.lib.ts).
  const fee = Math.max(1, Math.round((FREE_ORDER_FEE_USD_CENTS / 100) * rate * 10 ** decimals)) / 10 ** decimals;
  return {
    topUp: `${formatAmount(topUp, 0)} ${CURRENCY_WORD[currency]} (${formatAmount(TOP_UP_MIN_USD_CENTS / 100, 2)} ${CURRENCY_WORD.USD})`,
    fee: `${formatAmount(fee, decimals)} ${CURRENCY_WORD[currency]}`,
    currency,
  };
}

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
  hello: (name: string | null) => string;
  thanks: (store: string) => string;
  /** Before the template and product steps. */
  stepsIntro: string;
  templateTitle: string;
  templateSteps: string[];
  productTitle: string;
  productSteps: string[];
  /** One line after the template steps: products come next. */
  productNext: string;
  /** Template step: choosing one publishes the store (F-84: public from day one). */
  liveSoon: string;
  /** The store is published and public: share its link. */
  liveNow: (link: string) => string;
  /** Top up any time; the balance stays; the Free fee comes out of it automatically. */
  topUp: (amount: string, fee: string | null) => string;
  /** Where the top-up is in the dashboard. */
  topUpWhere: string;
  pending: string;
  checkIn: string;
  feeReminder: (fee: string) => string;
  proNoFee: string;
  closing: string;
  team: string;
};

const WALLET_PATH = "«المحفظة» ثم «الرصيد وشحن المحفظة»";
const TEMPLATE_PATH = "«المتجر الإلكتروني» ثم «القوالب»";
const PRODUCT_PATH = "«المنتجات» ثم «إضافة منتج»";

const EG: Copy = {
  hello: (name) => `مرحباً${name ? ` ${name}` : ""}، مع حضرتك ${SELLER_MESSAGE_SENDER} من منصة طلبي.`,
  thanks: (store) => `شكراً لفتح متجرك «${store}» على طلبي (Tallaby.com).`,
  stepsIntro: "عشان تكمّل متجرك فاضل خطوات بسيطة:",
  templateTitle: "*اختيار قالب لمتجرك:*",
  templateSteps: [
    `من القائمة افتح ${TEMPLATE_PATH}.`,
    "اتفرّج على التصميمات، وتقدر تضغط «معاينة» على أي قالب تشوفه الأول.",
    "اضغط «استخدام القالب» على اللي يعجبك.",
  ],
  productTitle: "*إضافة أول منتج:*",
  productSteps: [
    `من القائمة افتح ${PRODUCT_PATH}.`,
    "اختار «إضافة يدويًا» أو «إضافة بالذكاء الاصطناعي».",
    "اكتب الاسم والسعر وارفع الصور، وبعدين اضغط «نشر المنتج».",
  ],
  productNext: `وبعد كده ضيف منتجاتك من ${PRODUCT_PATH}.`,
  liveSoon: "وأول ما تختار القالب، متجرك هيبقى متاح أونلاين لعملائك.",
  liveNow: (link) =>
    `متجرك دلوقتي متاح أونلاين لعملائك، شارك لينك متجرك على صفحات البراند بتاعك على السوشيال ميديا:\n${link}`,
  topUp: (amount, fee) =>
    `تقدر تشحن محفظتك بـ ${amount} في أي وقت، والرصيد بيفضل في محفظة طلبي على طول${
      fee ? `، وكل طلب جديد بيتخصم منه ${fee} تلقائي.` : "."
    }`,
  topUpWhere: `الشحن من ${WALLET_PATH}.`,
  pending: "طلب شحن محفظتك وصلنا وبنراجع الإيصال، والرصيد هيتضاف أول ما يتأكد.",
  checkIn: "حبينا نطمّن على متجرك وإن كل حاجة ماشية معاك تمام.",
  feeReminder: (fee) => `للتذكير: بيتخصم ${fee} بس على كل طلب من رصيد محفظتك.`,
  proNoFee: "وعلى باقة Pro مفيش أي رسوم على طلباتك.",
  closing: "لو عندك أي استفسار ابعتلنا وإحنا تحت أمرك.",
  team: "فريق طلبي",
};

const SA: Copy = {
  hello: (name) => `هلا${name ? ` ${name}` : ""}، معك ${SELLER_MESSAGE_SENDER} من منصة طلبي.`,
  thanks: (store) => `نشكرك إنك فتحت متجرك «${store}» على طلبي (Tallaby.com).`,
  stepsIntro: "عشان تكمّل متجرك باقي لك خطوات بسيطة:",
  templateTitle: "*اختيار قالب لمتجرك:*",
  templateSteps: [
    `من القائمة افتح ${TEMPLATE_PATH}.`,
    "تصفّح التصاميم، وتقدر تضغط «معاينة» على أي قالب تشوفه قبل.",
    "اضغط «استخدام القالب» على اللي يعجبك.",
  ],
  productTitle: "*إضافة أول منتج:*",
  productSteps: [
    `من القائمة افتح ${PRODUCT_PATH}.`,
    "اختر «إضافة يدويًا» أو «إضافة بالذكاء الاصطناعي».",
    "اكتب الاسم والسعر وارفع الصور، وبعدها اضغط «نشر المنتج».",
  ],
  productNext: `وبعدها ضيف منتجاتك من ${PRODUCT_PATH}.`,
  liveSoon: "وأول ما تختار القالب، يصير متجرك متاح أونلاين لعملائك.",
  liveNow: (link) =>
    `متجرك الحين متاح أونلاين لعملائك، شارك رابط متجرك في حسابات علامتك التجارية على السوشيال ميديا:\n${link}`,
  topUp: (amount, fee) =>
    `تقدر تشحن محفظتك بـ ${amount} في أي وقت، والرصيد يبقى في محفظة طلبي على طول${
      fee ? `، وكل طلب جديد ينخصم منه ${fee} تلقائياً.` : "."
    }`,
  topUpWhere: `الشحن من ${WALLET_PATH}.`,
  pending: "وصلنا طلب شحن محفظتك وقاعدين نراجع الإيصال، والرصيد ينضاف أول ما يتأكد.",
  checkIn: "حبينا نطمّن على متجرك وإن أمورك كلها طيبة.",
  feeReminder: (fee) => `للتذكير: ينخصم ${fee} بس على كل طلب من رصيد محفظتك.`,
  proNoFee: "وعلى باقة Pro ما فيه أي رسوم على طلباتك.",
  closing: "إذا عندك أي استفسار راسلنا، وحنا بالخدمة.",
  team: "فريق طلبي",
};

/** UAE, Kuwait, Qatar, Bahrain, Oman: a neutral Gulf variant (no Saudi-only words). */
const GULF: Copy = {
  ...SA,
  hello: (name) => `مرحبا${name ? ` ${name}` : ""}، معك ${SELLER_MESSAGE_SENDER} من منصة طلبي.`,
  closing: "إذا عندك أي استفسار راسلنا، وإحنا في الخدمة.",
};

/** Jordan, Palestine, Lebanon, Syria. */
const LEVANT: Copy = {
  hello: (name) => `مرحبا${name ? ` ${name}` : ""}، معك ${SELLER_MESSAGE_SENDER} من منصة طلبي.`,
  thanks: (store) => `شكراً إنك فتحت متجرك «${store}» على طلبي (Tallaby.com).`,
  stepsIntro: "لتكمّل متجرك ضايل كم خطوة بسيطة:",
  templateTitle: "*اختيار قالب لمتجرك:*",
  templateSteps: [
    `من القائمة افتح ${TEMPLATE_PATH}.`,
    "تفرّج على التصاميم، وفيك تكبس «معاينة» على أي قالب لتشوفه أول.",
    "اكبس «استخدام القالب» على يلي بيعجبك.",
  ],
  productTitle: "*إضافة أول منتج:*",
  productSteps: [
    `من القائمة افتح ${PRODUCT_PATH}.`,
    "اختار «إضافة يدويًا» أو «إضافة بالذكاء الاصطناعي».",
    "اكتب الاسم والسعر وارفع الصور، وبعدين اكبس «نشر المنتج».",
  ],
  productNext: `وبعدها ضيف منتجاتك من ${PRODUCT_PATH}.`,
  liveSoon: "وأول ما تختار القالب، متجرك بيصير متاح أونلاين لزباينك.",
  liveNow: (link) =>
    `متجرك هلأ متاح أونلاين لزباينك، شارك رابط متجرك على صفحات البراند تبعك على السوشيال ميديا:\n${link}`,
  topUp: (amount, fee) =>
    `فيك تشحن محفظتك بـ ${amount} بأي وقت، والرصيد بيضل بمحفظة طلبي على طول${
      fee ? `، وكل طلب جديد بينخصم منه ${fee} تلقائياً.` : "."
    }`,
  topUpWhere: `الشحن من ${WALLET_PATH}.`,
  pending: "وصلنا طلب شحن محفظتك وعم نراجع الإيصال، والرصيد بينضاف أول ما يتأكد.",
  checkIn: "حبينا نطمّن على متجرك وإنو كل شي ماشي معك تمام.",
  feeReminder: (fee) => `للتذكير: بينخصم ${fee} بس على كل طلب من رصيد محفظتك.`,
  proNoFee: "وعلى باقة Pro ما في أي رسوم على طلباتك.",
  closing: "إذا عندك أي استفسار راسلنا، ونحنا بالخدمة.",
  team: "فريق طلبي",
};

/** Friendly Modern Standard Arabic, for a country we can't tell. */
const MSA: Copy = {
  hello: (name) => `مرحباً${name ? ` ${name}` : ""}، معك ${SELLER_MESSAGE_SENDER} من منصة طلبي.`,
  thanks: (store) => `نشكرك على فتح متجرك «${store}» على طلبي (Tallaby.com).`,
  stepsIntro: "بقيت خطوات بسيطة لإكمال متجرك:",
  templateTitle: "*اختيار قالب لمتجرك:*",
  templateSteps: [
    `من القائمة افتح ${TEMPLATE_PATH}.`,
    "تصفّح التصميمات، ويمكنك الضغط على «معاينة» لرؤية أي قالب أولاً.",
    "اضغط «استخدام القالب» على القالب الذي يعجبك.",
  ],
  productTitle: "*إضافة أول منتج:*",
  productSteps: [
    `من القائمة افتح ${PRODUCT_PATH}.`,
    "اختر «إضافة يدويًا» أو «إضافة بالذكاء الاصطناعي».",
    "اكتب الاسم والسعر وارفع الصور، ثم اضغط «نشر المنتج».",
  ],
  productNext: `بعد ذلك أضف منتجاتك من ${PRODUCT_PATH}.`,
  liveSoon: "وبمجرد اختيار القالب يصبح متجرك متاحاً على الإنترنت لعملائك.",
  liveNow: (link) =>
    `متجرك متاح الآن على الإنترنت لعملائك، شارك رابط متجرك على حسابات علامتك التجارية في وسائل التواصل الاجتماعي:\n${link}`,
  topUp: (amount, fee) =>
    `يمكنك شحن محفظتك بمبلغ ${amount} في أي وقت، ويبقى الرصيد في محفظة طلبي دائماً${
      fee ? `، ويُخصم منه ${fee} تلقائياً عن كل طلب جديد.` : "."
    }`,
  topUpWhere: `الشحن من ${WALLET_PATH}.`,
  pending: "وصلنا طلب شحن محفظتك ونراجع الإيصال الآن، وسيُضاف الرصيد بعد تأكيده.",
  checkIn: "أردنا أن نطمئن على متجرك وأن كل شيء يسير معك على ما يرام.",
  feeReminder: (fee) => `للتذكير: يُخصم ${fee} فقط عن كل طلب من رصيد محفظتك.`,
  proNoFee: "وعلى باقة Pro لا توجد أي رسوم على طلباتك.",
  closing: "إن كان لديك أي استفسار راسلنا، ونحن في خدمتك.",
  team: "فريق طلبي",
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
  plan: "free" | "pro";
  step: SellerMessageStep;
  activation: SellerActivation;
  money: Pick<MessageMoney, "topUp" | "fee">;
};

const numbered = (lines: string[]) => lines.map((line, i) => `${i + 1}. ${line}`).join("\n");

/**
 * The full message. Paragraphs are separated by a blank line. Since F-84
 * (2026-11-09) a published store is public from day one, so the message
 * shares its link and offers the top-up as something to do any time (owner:
 * short, and no mention of the 14-day grace window).
 */
export function buildSellerWhatsAppMessage(input: SellerMessageInput): string {
  const c = COPY[input.dialect];
  const fee = input.plan === "pro" ? null : input.money.fee;
  const blocks: string[] = [[c.hello(firstName(input.ownerName)), c.thanks(input.storeName)].join("\n")];
  const link = input.step === "template" ? null : input.storeLink;

  if (input.step === "ready" && input.activation === "active") {
    blocks.push(c.checkIn);
    if (link) blocks.push(c.liveNow(link));
    blocks.push(fee ? c.feeReminder(fee) : c.proNoFee);
  } else {
    if (input.step === "template") {
      blocks.push(`${c.stepsIntro}\n${c.templateTitle}\n${numbered(c.templateSteps)}\n${c.liveSoon}\n${c.productNext}`);
    } else if (input.step === "product") {
      blocks.push(`${c.stepsIntro}\n${c.productTitle}\n${numbered(c.productSteps)}`);
    }
    if (link) blocks.push(c.liveNow(link));
    if (input.activation === "needed") {
      blocks.push(`${c.topUp(input.money.topUp, fee)}\n${c.topUpWhere}`);
    } else if (input.activation === "pending") {
      blocks.push(c.pending);
    }
  }

  blocks.push(`${c.closing}\n${c.team}`);
  return blocks.join("\n\n");
}
