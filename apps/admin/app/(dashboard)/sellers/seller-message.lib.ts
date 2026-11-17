import { toWhatsAppNumber } from "@workspace/ui/lib/contact";

/**
 * The WhatsApp message Admin sends a seller from the sellers list and the
 * seller page (owner, 2026-11-08), in the seller's dialect. Since 2026-11-17
 * it is three short lines (see `COPY`): a greeting for the time of day in
 * Cairo, who is writing, and the follow-up sentence; it never asks for money.
 * Pure: the facts come from seller-message.server.ts, and the time from `now`.
 */

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

/** Who the message is from (owner, 2026-11-17). */
const SENDER_NAME = "عمر";

const CAIRO_HOUR = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", hour: "numeric", hourCycle: "h23" });

/**
 * The greeting for the time of day in Cairo, whatever the server's timezone
 * (owner, 2026-11-17): before 12:00 noon "صباح الخير", from 12:00 on "مساء الخير".
 */
export function messageGreeting(now: Date): string {
  const hour = Number(CAIRO_HOUR.formatToParts(now).find((part) => part.type === "hour")?.value);
  return hour < 12 ? "صباح الخير" : "مساء الخير";
}

type MessageCopy = {
  /** Added after the greeting on the first line. */
  greetingSuffix: string;
  /** Who is writing. */
  intro: string;
  /** The follow-up sentence. */
  followUp: string;
};

/**
 * Owner, 2026-11-17: three short lines (greeting, who is writing, follow-up),
 * as simple as possible, the same for every seller whatever step they're at
 * (one line from 2026-11-16 until then). Egypt uses the owner's own words.
 */
const COPY: Record<MessageDialect, MessageCopy> = {
  eg: {
    greetingSuffix: " يا فندم",
    intro: `مع حضرتك ${SENDER_NAME} من منصة طلبي`,
    followUp: "حضرتك سجلت معانا، وبتابع معاك لو محتاج أي مساعدة.",
  },
  sa: {
    greetingSuffix: "",
    intro: `معك ${SENDER_NAME} من منصة طلبي`,
    followUp: "سجّلت معنا، وأتابع معك إذا احتجت أي مساعدة.",
  },
  gulf: {
    greetingSuffix: "",
    intro: `معك ${SENDER_NAME} من منصة طلبي`,
    followUp: "سجّلت معنا، وأتابع معك إذا احتجت أي مساعدة.",
  },
  levant: {
    greetingSuffix: "",
    intro: `معك ${SENDER_NAME} من منصة طلبي`,
    followUp: "سجّلت عنا، وعم تابع معك إذا بدك أي مساعدة.",
  },
  msa: {
    greetingSuffix: "",
    intro: `معك ${SENDER_NAME} من منصة طلبي`,
    followUp: "لقد سجّلت معنا، وأتابع معك إن احتجت أي مساعدة.",
  },
};

export type SellerMessageInput = {
  dialect: MessageDialect;
  /** Kept for callers; the message doesn't use them (owner, 2026-11-16). */
  ownerName: string | null;
  storeName: string;
  storeLink: string | null;
  step: SellerMessageStep;
  activation: SellerActivation;
  /** The moment the message is built, for the greeting; defaults to now. */
  now?: Date;
};

/** The message: three lines in the seller's dialect, greeting by the time of day in Cairo. */
export function buildSellerWhatsAppMessage(input: SellerMessageInput): string {
  const copy = COPY[input.dialect];
  const greeting = messageGreeting(input.now ?? new Date());
  return [`${greeting}${copy.greetingSuffix}`, copy.intro, copy.followUp].join("\n");
}
