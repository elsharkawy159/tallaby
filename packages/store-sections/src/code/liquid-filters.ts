/**
 * The filters a code section adds to the liquidjs standard ones (ROADMAP F-101,
 * code-sections design §11.4). All pure: no I/O, no clock, no randomness.
 * The request's locale and currency come from a context register the engine
 * sets per render (`FILTER_CONTEXT_REGISTER`), never from template variables.
 *
 * Filters that build markup (`image_tag`, `link_to`, `placeholder_svg_tag`)
 * escape every value they insert and are marked `raw`, so their tags print as
 * tags; any other output is escaped by the engine. The render-time HTML
 * cleaning (`sanitize-code.ts`) still runs on the result.
 */
import type { FilterImplOptions, Liquid } from "liquidjs";
import { hasDangerousScheme, isHttpOrRelativeUrl } from "../config/url";
import { escapeAttribute, LiquidHtml } from "./liquid-objects";

export const FILTER_CONTEXT_REGISTER = "tallaby:code";

export type FilterContext = {
  locale: "ar" | "en";
  /** ISO code of the store currency, e.g. "EGP". */
  currency: string;
  /**
   * The store's currency label as text (e.g. "جنيه"), as the storefront shows
   * it (`currencyLabelText` in @workspace/lib). Defaults to the currency's
   * default label as text.
   */
  currencyLabel?: string;
};

type FilterThis = { context: { getRegister(key: string): unknown } };

function filterContext(self: FilterThis): FilterContext {
  const ctx = self.context.getRegister(FILTER_CONTEXT_REGISTER) as FilterContext | undefined;
  return ctx ?? { locale: "ar", currency: "EGP" };
}

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

const amountFormats = new Map<string, Intl.NumberFormat>();

/** The amount as the storefront writes it (`formatAmount` in @workspace/lib/utils/formatPrice): western digits, 0–2 decimals. */
function formatAmount(major: number, locale: "ar" | "en"): string {
  let format = amountFormats.get(locale);
  if (!format) {
    format =
      locale === "ar"
        ? new Intl.NumberFormat("ar-EG", { minimumFractionDigits: 0, maximumFractionDigits: 2, numberingSystem: "latn" })
        : new Intl.NumberFormat("en-EG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    amountFormats.set(locale, format);
  }
  return format.format(major);
}

/** The text of a currency's default label (first symbol in STORE_CURRENCIES; the Saudi Riyal symbol reads ر.س / SAR). */
function defaultLabel(currency: string, locale: "ar" | "en"): string {
  if (currency === "SAR") return locale === "ar" ? "ر.س" : "SAR";
  return currency;
}

export type MoneyFormat = "money" | "money_with_currency" | "money_without_trailing_zeros";

/**
 * Minor units (1/100) → "1,250 EGP". Like the storefront, whole amounts show no
 * decimals, so `money` and `money_without_trailing_zeros` read the same;
 * `money_with_currency` always ends in the ISO code.
 */
export function formatMoney(minor: unknown, ctx: FilterContext, format: MoneyFormat = "money"): string {
  const n = typeof minor === "number" ? minor : typeof minor === "string" && minor.trim() !== "" ? Number(minor) : NaN;
  if (!Number.isFinite(n)) return "";
  const amount = formatAmount(Math.round(n) / 100, ctx.locale);
  const currency = String(ctx.currency || "EGP").toUpperCase();
  const label = format === "money_with_currency" ? currency : ctx.currencyLabel || defaultLabel(currency, ctx.locale);
  return `${amount} ${label}`;
}

// ---------------------------------------------------------------------------
// Images and links
// ---------------------------------------------------------------------------

type NamedArg = [string, unknown];

function namedArgs(args: unknown[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const arg of args) {
    if (Array.isArray(arg) && arg.length === 2 && typeof arg[0] === "string") out[(arg as NamedArg)[0]] = arg[1];
  }
  return out;
}

function imageSource(input: unknown): { src: string; alt: string; width: number | null; height: number | null } | null {
  if (typeof input === "string") return { src: input, alt: "", width: null, height: null };
  if (input && typeof input === "object") {
    const o = input as Record<string, unknown>;
    const src = Object.hasOwn(o, "src") ? o.src : Object.hasOwn(o, "url") ? o.url : undefined;
    if (typeof src !== "string") return null;
    return {
      src,
      alt: typeof o.alt === "string" ? o.alt : "",
      width: typeof o.width === "number" ? o.width : null,
      height: typeof o.height === "number" ? o.height : null,
    };
  }
  return null;
}

function safeImageUrl(url: string): string | null {
  const v = url.trim();
  if (!v || hasDangerousScheme(v) || !isHttpOrRelativeUrl(v)) return null;
  return v;
}

function safeHref(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const v = url.trim();
  if (!v || hasDangerousScheme(v)) return null;
  if (isHttpOrRelativeUrl(v) || /^#[\w-]*$/.test(v) || /^(?:mailto|tel):[^\s<>"']+$/i.test(v)) return v;
  return null;
}

function dimension(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.min(Math.round(n), 5000) : null;
}

/**
 * The image URL. TODO(F-101d): ask for a resized copy once the storefront has a
 * pure resize-URL helper for store media (today next/image resizes at render,
 * with sizes from the app's config); until then `width`/`height` are accepted
 * and the URL is returned unchanged.
 */
export function imageUrl(input: unknown): string {
  const img = imageSource(input);
  return (img && safeImageUrl(img.src)) ?? "";
}

export function imageTag(input: unknown, args: Record<string, unknown>): string {
  const img = imageSource(input);
  const src = img && safeImageUrl(img.src);
  if (!img || !src) return "";
  const alt = typeof args.alt === "string" ? args.alt : img.alt;
  const width = dimension(args.width) ?? img.width;
  const height = dimension(args.height) ?? img.height;
  const loading = args.loading === "eager" ? "eager" : "lazy";
  let out = `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}"`;
  if (width) out += ` width="${width}"`;
  if (height) out += ` height="${height}"`;
  if (typeof args.class === "string" && args.class) out += ` class="${escapeAttribute(args.class)}"`;
  return `${out} loading="${loading}">`;
}

function textOf(value: unknown): string {
  if (value instanceof LiquidHtml) return value.html;
  if (value == null) return "";
  return escapeAttribute(String(value));
}

export function linkTo(text: unknown, url: unknown, title?: unknown): string {
  const body = textOf(text);
  const href = safeHref(url);
  if (!href) return body;
  const titleAttr = typeof title === "string" && title ? ` title="${escapeAttribute(title)}"` : "";
  return `<a href="${escapeAttribute(href)}"${titleAttr}>${body}</a>`;
}

/** A fixed, static picture placeholder. The name is ignored; the class is escaped. */
export function placeholderSvgTag(_name: unknown, className?: unknown): string {
  const cls = typeof className === "string" && className ? ` class="${escapeAttribute(className)}"` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-hidden="true" focusable="false"${cls}>` +
    `<rect width="400" height="300" fill="#e5e7eb"/>` +
    `<path d="M120 210l60-70 45 50 30-35 45 55z" fill="#9ca3af"/>` +
    `<circle cx="255" cy="105" r="20" fill="#9ca3af"/></svg>`
  );
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

export const STOREFRONT_STRINGS = {
  add_to_cart: { ar: "أضف إلى السلة", en: "Add to cart" },
  sold_out: { ar: "نفدت الكمية", en: "Sold out" },
  sale: { ar: "خصم", en: "Sale" },
  view_all: { ar: "عرض الكل", en: "View all" },
  price: { ar: "السعر", en: "Price" },
  from: { ar: "يبدأ من", en: "From" },
  quantity: { ar: "الكمية", en: "Quantity" },
  search: { ar: "بحث", en: "Search" },
} as const;

export function translate(key: unknown, locale: "ar" | "en"): string {
  const k = String(key ?? "");
  return Object.hasOwn(STOREFRONT_STRINGS, k) ? STOREFRONT_STRINGS[k as keyof typeof STOREFRONT_STRINGS][locale] : k;
}

/** "Summer Sale 2026!" → "summer-sale-2026". Arabic letters are kept. */
export function handleize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

const html = (handler: (this: FilterThis, value: unknown, ...args: unknown[]) => string): FilterImplOptions => ({
  raw: true,
  handler,
});

export const CODE_FILTER_NAMES = [
  "money", "money_with_currency", "money_without_trailing_zeros",
  "image_url", "image_tag", "link_to", "placeholder_svg_tag", "t", "handleize",
] as const;

export function registerCodeFilters(engine: Liquid): void {
  for (const format of ["money", "money_with_currency", "money_without_trailing_zeros"] as const) {
    engine.registerFilter(format, function (this: FilterThis, value: unknown) {
      return formatMoney(value, filterContext(this), format);
    });
  }
  engine.registerFilter("image_url", (value: unknown) => imageUrl(value));
  engine.registerFilter("image_tag", html((value, ...args) => imageTag(value, namedArgs(args))));
  engine.registerFilter("link_to", html((text, url, title) => linkTo(text, url, title)));
  engine.registerFilter("placeholder_svg_tag", html((name, cls) => placeholderSvgTag(name, cls)));
  engine.registerFilter("t", function (this: FilterThis, value: unknown) {
    return translate(value, filterContext(this).locale);
  });
  engine.registerFilter("handleize", (value: unknown) => handleize(value));
}
