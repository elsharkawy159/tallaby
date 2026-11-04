export const DEFAULT_CURRENCY = "EGP";

/**
 * The label that means "draw the official Saudi Riyal symbol". An internal
 * value saved in stores.settings: people never see it (see currencyLabelText).
 */
export const SAUDI_RIYAL_LABEL = "sar-symbol";

/**
 * The currencies a store can show its prices in (Store settings › General,
 * stores.settings.currency), each with the symbols it can be labelled with
 * (stores.settings.currencyLabel). Display only: amounts are not converted.
 * Symbols are a fixed list, never free text, because `formatPrice` puts the
 * label into HTML. The first symbol is the currency's default. Egypt and the
 * Gulf first, then the major world currencies.
 */
export const STORE_CURRENCIES = {
  EGP: ["EGP", "ج.م", "جنيهاً"],
  SAR: [SAUDI_RIYAL_LABEL, "SAR", "ر.س", "ريال"],
  AED: ["AED", "د.إ", "درهم"],
  KWD: ["KWD", "د.ك", "دينار"],
  QAR: ["QAR", "ر.ق", "ريال"],
  BHD: ["BHD", "د.ب", "دينار"],
  OMR: ["OMR", "ر.ع", "ريال"],
  USD: ["USD", "$", "دولار"],
  EUR: ["EUR", "€", "يورو"],
  GBP: ["GBP", "£", "إسترليني"],
} as const;

export type StoreCurrency = keyof typeof STORE_CURRENCIES;
export const STORE_CURRENCY_CODES = Object.keys(STORE_CURRENCIES) as [StoreCurrency, ...StoreCurrency[]];
/** Shown first in the currency picker; the rest are international. */
export const REGIONAL_CURRENCY_CODES: readonly StoreCurrency[] = ["EGP", "SAR", "AED", "KWD", "QAR", "BHD", "OMR"];

export type CurrencyLabel = (typeof STORE_CURRENCIES)[StoreCurrency][number];
export const CURRENCY_LABELS = [...new Set(Object.values(STORE_CURRENCIES).flat())] as [CurrencyLabel, ...CurrencyLabel[]];

export function isStoreCurrency(value: unknown): value is StoreCurrency {
  return typeof value === "string" && Object.hasOwn(STORE_CURRENCIES, value);
}

/** Whether `label` is one of `currency`'s symbols. */
export function isCurrencyLabelFor(currency: StoreCurrency, label: unknown): label is CurrencyLabel {
  return (STORE_CURRENCIES[currency] as readonly unknown[]).includes(label);
}

/**
 * A store's currency and label from `stores.settings`. Stores saved before
 * `currency` existed only have an EGP label, so they read as EGP.
 */
export function parseStoreCurrency(settings: unknown): { currency: StoreCurrency; label: CurrencyLabel } {
  const s = (settings ?? {}) as Record<string, unknown>;
  const currency = isStoreCurrency(s.currency) ? s.currency : DEFAULT_CURRENCY;
  const label = isCurrencyLabelFor(currency, s.currencyLabel) ? s.currencyLabel : STORE_CURRENCIES[currency][0];
  return { currency, label };
}

/** A label as text, for places that can't draw markup: <option>, titles, meta tags, messages. */
export function currencyLabelText(label: CurrencyLabel, locale: string): string {
  if (label !== SAUDI_RIYAL_LABEL) return label;
  return locale.startsWith("ar") ? "ر.س" : "SAR";
}

/** The Saudi Riyal symbol, sized to the text around it (lucide's `saudi-riyal` paths). A fixed string, safe as HTML. */
export function saudiRiyalSvg(locale: string): string {
  const name = locale.startsWith("ar") ? "ريال سعودي" : "Saudi riyal";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${name}" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.125em">` +
    '<path d="m20 19.5-5.5 1.2"/><path d="M14.5 4v11.22a1 1 0 0 0 1.242.97L20 15.2"/><path d="m2.978 19.351 5.549-1.363A2 2 0 0 0 10 16V2"/><path d="M20 10 4 13.5"/></svg>'
  );
}

/** A label as HTML: the symbol's SVG, or the label itself (a fixed list, so safe). */
export function currencyLabelHtml(label: CurrencyLabel, locale: string): string {
  return label === SAUDI_RIYAL_LABEL ? saudiRiyalSvg(locale) : label;
}

function formatAmount(amount: number, locale: string, options?: Partial<Intl.NumberFormatOptions>) {
  const isArabic = locale.startsWith("ar");
  const { style: _style, currency: _currency, currencyDisplay: _display, ...rest } = options ?? {};
  return new Intl.NumberFormat(isArabic ? "ar-EG" : "en-EG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...rest,
    // Western digits in Arabic too, so amounts read like what sellers type.
    ...(isArabic && { numberingSystem: "latn" }),
  }).format(amount);
}

/**
 * Standard currency formatting for admin and dashboard surfaces: "2,500 EGP".
 */
export function formatCurrency(
  amount: number,
  locale = "en-EG",
  options?: Partial<Intl.NumberFormatOptions>,
  label: CurrencyLabel = DEFAULT_CURRENCY,
): string {
  return `${formatAmount(amount, locale, options)} ${currencyLabelText(label, locale)}`;
}

/**
 * Parse display currency strings like "EGP 2,500" or "2,500 EGP".
 */
export function parseCurrencyAmount(value: string): number {
  const parsed = parseInt(value.replace(/[^d]/g, ""), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

type FormatPriceSize = "lg" | "md" | "sm";

const sizeToClass: Record<FormatPriceSize, string> = {
  lg: "text-lg",
  md: "text-base",
  sm: "text-xs",
};

/**
 * Plain-text price formatting for labels, filters, and metadata: "300 EGP"
 * (or the store's chosen label, e.g. "300 جنيهاً"). Always text: the Saudi Riyal
 * symbol reads "ر.س" in Arabic and "SAR" in English.
 */
export function formatPricePlain(price: number, locale: string, label: CurrencyLabel = DEFAULT_CURRENCY): string {
  return `${formatAmount(price, locale)} ${currencyLabelText(label, locale)}`;
}

/** Stands for the symbol in `formatPriceMarked` text (a private-use character). */
export const PRICE_SYMBOL_MARK = "\uE000";

/**
 * `formatPricePlain` for a React surface that can draw the symbol: the same text,
 * with a mark where the symbol goes. Render the result, or a sentence around it,
 * only through a component that replaces the mark (the storefront's `PriceText`),
 * never in an attribute, a title or a message.
 */
export function formatPriceMarked(price: number, locale: string, label: CurrencyLabel = DEFAULT_CURRENCY): string {
  return label === SAUDI_RIYAL_LABEL ? `${formatAmount(price, locale)} ${PRICE_SYMBOL_MARK}` : formatPricePlain(price, locale, label);
}

export function formatPrice(
  price: number,
  locale: string,
  currencySize: FormatPriceSize = "sm",
  label: CurrencyLabel = DEFAULT_CURRENCY,
): string {
  const sizeClass = sizeToClass[currencySize] || sizeToClass.sm;
  return `${formatAmount(price, locale)} <span class="${sizeClass}">${currencyLabelHtml(label, locale)}</span>`;
}

/**
 * @deprecated Do not use this function in price calculations.
 * Prices should be calculated without rounding to maintain precision.
 * This function is kept for backwards compatibility only.
 */
export function roundPrice(price: number): number {
  // Return price without rounding to maintain calculation precision
  return price;
}
