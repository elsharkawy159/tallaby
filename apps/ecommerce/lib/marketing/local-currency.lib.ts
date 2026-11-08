import { formatEgp, formatUsd, usdCentsToEgp } from "./pricing.lib";

/**
 * tallaby.com's plan prices in the visitor's own currency (owner, 2026-11-08).
 * The country comes from the visitor's IP (`/api/geo`); a country we don't map
 * (the US included) shows USD only. EGP uses the dashboard wallet's rate and
 * rounding, every other currency the open exchange-rate feed.
 */

const EURO_COUNTRIES = [
  "AT", "BE", "BG", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT",
  "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK",
  // Use the euro without being in the euro area.
  "AD", "MC", "ME", "SM", "VA", "XK",
] as const;

export const COUNTRY_CURRENCY: Readonly<Record<string, string>> = {
  EG: "EGP",
  SA: "SAR",
  AE: "AED",
  KW: "KWD",
  QA: "QAR",
  BH: "BHD",
  OM: "OMR",
  JO: "JOD",
  IQ: "IQD",
  MA: "MAD",
  DZ: "DZD",
  TN: "TND",
  LY: "LYD",
  TR: "TRY",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
  ...Object.fromEntries(EURO_COUNTRIES.map((country) => [country, "EUR"])),
};

/** Every currency a card can show besides USD, EGP first. */
export const LOCAL_CURRENCIES: readonly string[] = [...new Set(Object.values(COUNTRY_CURRENCY))];

/** Currencies the exchange-rate feed is read for (EGP comes from the billing rate instead). */
export const FEED_CURRENCIES: readonly string[] = LOCAL_CURRENCIES.filter((code) => code !== "EGP");

/** Decimal places of the currency's minor unit. */
export function minorDigits(currency: string): number {
  if (currency === "IQD") return 0;
  return ["KWD", "BHD", "OMR", "JOD", "TND", "LYD"].includes(currency) ? 3 : 2;
}

/** The visitor's currency for an ISO country code, or null for USD only. */
export function currencyForCountry(country: string | null | undefined): string | null {
  if (!country) return null;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? null;
}

const format = (amount: number, digits: number) =>
  amount.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: digits });

/**
 * A USD price in a local currency, as the card shows it (Latin digits, en-US
 * grouping). EGP: the wallet's rounding (`usdCentsToEgp`). Others: under 1,
 * the nearest minor unit, never below one so it never reads 0; from 100, whole units; in
 * between, the minor unit's decimals (2; 3 for KWD and the like; 0 for IQD).
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

/** The currency a price shows in, with its rate and label ("ريال" / "SAR"); null = USD only. */
export type LocalCurrency = { currency: string; rate: number; label: string } | null;

/**
 * A price inside a sentence: "0.12 ريال ($0.03)", or "$0.03" with no local
 * currency. The USD sits in a left-to-right isolate so the brackets stay put
 * in Arabic text.
 */
export function formatLocalMoneyText(usdCents: number, local: LocalCurrency): string {
  const usd = formatUsd(usdCents);
  if (!local) return usd;
  return `${formatLocalAmount(usdCents, local.currency, local.rate)} ${local.label} (⁦${usd}⁩)`;
}

/** The rate in the footnote: 53.9, 3.75, 0.3071. */
export function formatRate(rate: number): string {
  return format(rate, rate < 10 ? 4 : 2);
}
