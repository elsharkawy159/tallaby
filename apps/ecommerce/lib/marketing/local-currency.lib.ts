import { formatEgpApprox } from "@workspace/lib/billing";
import { type MarketingPriceVars, formatEgp, priceVarsWith, usdCentsToEgp } from "./pricing.lib";

/**
 * tallaby.com's plan prices in the visitor's own currency (owner, 2026-11-08;
 * every country, owner 2026-11-10). The country comes from the visitor's IP
 * (the proxy's `Server-Timing: geo`, else `/api/geo`). A known country shows
 * its own currency when the exchange-rate feed has a rate for it, else USD.
 * EGP uses the dashboard wallet's rate and rounding, USD is the billing
 * currency itself (no "≈"), every other currency the open exchange-rate feed.
 */

/** The billing currency: always available at rate 1. */
export const USD = "USD";

/**
 * Every ISO 3166-1 country (plus Kosovo, XK) to the currency people there pay
 * in (ISO 4217). Countries that use the US dollar (Ecuador, Panama, El
 * Salvador, Timor-Leste, …) map to USD. Antarctica (AQ) has none, so it shows
 * USD like any code that isn't here.
 */
export const COUNTRY_CURRENCY: Readonly<Record<string, string>> = {
  // Egypt and the Arab League first.
  EG: "EGP", SA: "SAR", AE: "AED", KW: "KWD", QA: "QAR", BH: "BHD", OM: "OMR",
  JO: "JOD", LB: "LBP", SY: "SYP", IQ: "IQD", PS: "ILS", YE: "YER", SD: "SDG",
  LY: "LYD", TN: "TND", DZ: "DZD", MA: "MAD", MR: "MRU", SO: "SOS", DJ: "DJF", KM: "KMF",
  // The euro, in and outside the euro area.
  AT: "EUR", BE: "EUR", BG: "EUR", CY: "EUR", DE: "EUR", EE: "EUR", ES: "EUR", FI: "EUR",
  FR: "EUR", GR: "EUR", HR: "EUR", IE: "EUR", IT: "EUR", LT: "EUR", LU: "EUR", LV: "EUR",
  MT: "EUR", NL: "EUR", PT: "EUR", SI: "EUR", SK: "EUR", AD: "EUR", MC: "EUR", ME: "EUR",
  SM: "EUR", VA: "EUR", XK: "EUR", AX: "EUR", BL: "EUR", GF: "EUR", GP: "EUR", MF: "EUR",
  MQ: "EUR", PM: "EUR", RE: "EUR", TF: "EUR", YT: "EUR",
  // The US dollar.
  US: "USD", AS: "USD", BQ: "USD", EC: "USD", FM: "USD", GU: "USD", IO: "USD", MH: "USD",
  MP: "USD", PA: "USD", PR: "USD", PW: "USD", SV: "USD", TC: "USD", TL: "USD", UM: "USD",
  VG: "USD", VI: "USD",
  // Everyone else, A to Z.
  AF: "AFN", AG: "XCD", AI: "XCD", AL: "ALL", AM: "AMD", AO: "AOA", AR: "ARS", AU: "AUD",
  AW: "AWG", AZ: "AZN", BA: "BAM", BB: "BBD", BD: "BDT", BF: "XOF", BI: "BIF", BJ: "XOF",
  BM: "BMD", BN: "BND", BO: "BOB", BR: "BRL", BS: "BSD", BT: "BTN", BV: "NOK", BW: "BWP",
  BY: "BYN", BZ: "BZD", CA: "CAD", CC: "AUD", CD: "CDF", CF: "XAF", CG: "XAF", CH: "CHF",
  CI: "XOF", CK: "NZD", CL: "CLP", CM: "XAF", CN: "CNY", CO: "COP", CR: "CRC", CU: "CUP",
  CV: "CVE", CW: "XCG", CX: "AUD", CZ: "CZK", DK: "DKK", DM: "XCD", DO: "DOP", EH: "MAD",
  ER: "ERN", ET: "ETB", FJ: "FJD", FK: "FKP", FO: "DKK", GA: "XAF", GB: "GBP", GD: "XCD",
  GE: "GEL", GG: "GBP", GH: "GHS", GI: "GIP", GL: "DKK", GM: "GMD", GN: "GNF", GQ: "XAF",
  GS: "GBP", GT: "GTQ", GW: "XOF", GY: "GYD", HK: "HKD", HM: "AUD", HN: "HNL", HT: "HTG",
  HU: "HUF", ID: "IDR", IL: "ILS", IM: "GBP", IN: "INR", IR: "IRR", IS: "ISK", JE: "GBP",
  JM: "JMD", JP: "JPY", KE: "KES", KG: "KGS", KH: "KHR", KI: "AUD", KN: "XCD", KP: "KPW",
  KR: "KRW", KY: "KYD", KZ: "KZT", LA: "LAK", LC: "XCD", LI: "CHF", LK: "LKR", LR: "LRD",
  LS: "LSL", MD: "MDL", MG: "MGA", MK: "MKD", ML: "XOF", MM: "MMK", MN: "MNT", MO: "MOP",
  MS: "XCD", MU: "MUR", MV: "MVR", MW: "MWK", MX: "MXN", MY: "MYR", MZ: "MZN", NA: "NAD",
  NC: "XPF", NE: "XOF", NF: "AUD", NG: "NGN", NI: "NIO", NO: "NOK", NP: "NPR", NR: "AUD",
  NU: "NZD", NZ: "NZD", PE: "PEN", PF: "XPF", PG: "PGK", PH: "PHP", PK: "PKR", PL: "PLN",
  PN: "NZD", PY: "PYG", RO: "RON", RS: "RSD", RU: "RUB", RW: "RWF", SB: "SBD", SC: "SCR",
  SE: "SEK", SG: "SGD", SH: "SHP", SJ: "NOK", SL: "SLE", SN: "XOF", SR: "SRD", SS: "SSP",
  ST: "STN", SX: "XCG", SZ: "SZL", TD: "XAF", TG: "XOF", TH: "THB", TJ: "TJS", TK: "NZD",
  TM: "TMT", TO: "TOP", TR: "TRY", TT: "TTD", TV: "AUD", TW: "TWD", TZ: "TZS", UA: "UAH",
  UG: "UGX", UY: "UYU", UZ: "UZS", VC: "XCD", VE: "VES", VN: "VND", VU: "VUV", WF: "XPF",
  WS: "WST", ZA: "ZAR", ZM: "ZMW", ZW: "ZWG",
};

/** Every currency a price can show in, EGP first, USD second. */
export const LOCAL_CURRENCIES: readonly string[] = [...new Set(["EGP", USD, ...Object.values(COUNTRY_CURRENCY)])];

/** Currencies the exchange-rate feed is read for: all but EGP (the billing rate) and USD (rate 1). */
export const FEED_CURRENCIES: readonly string[] = LOCAL_CURRENCIES.filter((code) => code !== "EGP" && code !== USD);

const digitsCache = new Map<string, number>();

/** Decimal places of the currency's minor unit, from Intl (JPY 0, KWD 3, IQD 0, …); 2 for a code Intl rejects. */
export function minorDigits(currency: string): number {
  const cached = digitsCache.get(currency);
  if (cached !== undefined) return cached;
  let digits = 2;
  try {
    digits = new Intl.NumberFormat("en-US", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  } catch {
    // Not a well-formed code: keep 2.
  }
  digitsCache.set(currency, digits);
  return digits;
}

/** The currency of an ISO country code, or null for a code we don't know (no country, AQ, junk). */
export function currencyForCountry(country: string | null | undefined): string | null {
  if (!country) return null;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? null;
}

/** What a page shows before (and without) the visitor's country: EGP on Arabic pages, USD on English ones. */
export function defaultCurrency(locale: string): string {
  return locale.startsWith("en") ? USD : "EGP";
}

/**
 * The currency to show a visitor: the page's default while the country is
 * unknown (`null`), else the country's own currency when `available` (we have
 * a rate for it), else USD.
 */
export function visitorCurrency(country: string | null, locale: string, available: (code: string) => boolean): string {
  if (!country) return defaultCurrency(locale);
  const code = currencyForCountry(country);
  return code && available(code) ? code : USD;
}

/**
 * A currency's label: the Arabic word for the currencies that have one in
 * `pricing.plans.currency` (`labels`), else the ISO code. English labels are
 * the ISO codes.
 */
export function currencyLabel(code: string, labels: Readonly<Record<string, string>>): string {
  return labels[code] || code;
}

const format = (amount: number, digits: number) =>
  amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits });

/**
 * A USD price in a local currency, as the card shows it (Latin digits, en-US
 * grouping). EGP: the wallet's rounding (`usdCentsToEgp`). Others: under 1,
 * the nearest minor unit, never below one so it never reads 0; from 100, whole units; in
 * between, the minor unit's decimals (2; 3 for KWD and the like; 0 for JPY or IQD).
 */
export function formatLocalAmount(usdCents: number, currency: string, rate: number): string {
  if (currency === "EGP") return formatEgp(usdCentsToEgp(usdCents, rate));
  const amount = (Math.max(0, usdCents) / 100) * rate;
  const minor = minorDigits(currency);
  if (amount < 1) {
    const scale = 10 ** minor;
    return format(Math.max(1, Math.round(amount * scale)) / scale, minor);
  }
  if (amount >= 100) return format(Math.round(amount), 0);
  return format(amount, minor);
}

/** True when a price in `currency` is converted, so it shows with "≈" (every currency but USD). */
export const isApproxCurrency = (currency: string) => currency !== USD;

/** The currency a price shows in, with its rate and label ("ريال" / "SAR"); null = USD only. */
export type LocalCurrency = { currency: string; rate: number; label: string } | null;

/**
 * A price as tallaby.com shows it, in the visitor's currency with "≈" (owner,
 * 2026-11-09): EGP through the billing module's `formatEgpApprox` ("≈ 1.62 جنيه",
 * "≈ 1.62 EGP"); another currency the same way, "≈ 0.11 ريال" / "≈ 0.11 SAR";
 * USD, the billing currency, without "≈" ("0.03 USD"). In Arabic only the
 * number sits in a left-to-right isolate. `label` is the currency's word
 * (Arabic) or code (English).
 */
export function formatLocalApprox(usdCents: number, currency: string, rate: number, locale: string, label: string): string {
  if (currency === "EGP") return formatEgpApprox(usdCents, rate, locale);
  const amount = formatLocalAmount(usdCents, currency, rate);
  const approx = isApproxCurrency(currency) ? "≈ " : "";
  return locale === "en" ? `${approx}${amount} ${label}` : `${approx}⁦${amount}⁩ ${label}`;
}

/** Every price token in one currency. */
export function localPriceVars(currency: string, rate: number, locale: string, label: string): MarketingPriceVars {
  return priceVarsWith((cents) => formatLocalApprox(cents, currency, rate, locale, label), locale);
}

/**
 * What `VisitorPricesProvider` needs to show every price in the visitor's
 * currency (`getMarketingPriceTable`): the USD→X rates (EGP and USD always,
 * the others when the feed has them) and the currency labels. The browser
 * formats the tokens, so a page carries ~160 numbers, not every token in every currency.
 */
export type MarketingPriceTable = {
  locale: string;
  rates: Readonly<Record<string, number>>;
  /** `pricing.plans.currency`: a word per currency in Arabic, the ISO code in English; a missing one shows its ISO code. */
  labels: Readonly<Record<string, string>>;
};

/** The rate in the footnote: 53.9, 3.75, 0.3071. */
export function formatRate(rate: number): string {
  return format(rate, rate < 10 ? 4 : 2);
}
