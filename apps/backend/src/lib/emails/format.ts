import {
  emailDateLocale,
  emailIntlLocale,
  type EmailLocale,
} from "@workspace/emails";

export const DEFAULT_CURRENCY = "EGP";

export const SITE_URL = (
  process.env.ECOMMERCE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.tallaby.com"
).replace(/\/+$/, "");

export const DASHBOARD_URL = (process.env.DASHBOARD_URL || "https://dashboard.tallaby.com").replace(/\/+$/, "");

export function formatMoney(
  value: string | number | null | undefined,
  locale: EmailLocale,
  currency: string = DEFAULT_CURRENCY,
): string {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat(emailIntlLocale(locale), {
    style: "currency",
    currency: currency || DEFAULT_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function toDate(value: string | Date | null | undefined): Date {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export function formatDate(value: string | Date | null | undefined, locale: EmailLocale): string {
  return toDate(value).toLocaleDateString(emailDateLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Africa/Cairo",
  });
}

export function formatDateTime(value: string | Date | null | undefined, locale: EmailLocale): string {
  return toDate(value).toLocaleString(emailDateLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Cairo",
  });
}

export function addDays(value: string | Date | null | undefined, days: number): Date {
  return new Date(toDate(value).getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Resolves a product image to an absolute URL. Storage keys are expanded to
 * their Supabase public URL; anything we cannot resolve confidently is dropped
 * so the email never renders a broken image.
 */
export function resolveImageUrl(images: unknown): string | null {
  const first = Array.isArray(images) ? (images[0] as unknown) : images;
  const key =
    typeof first === "string"
      ? first
      : typeof (first as { url?: unknown } | null)?.url === "string"
        ? (first as { url: string }).url
        : null;

  if (!key?.trim()) return null;
  if (key.startsWith("http://") || key.startsWith("https://")) return key;

  const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID;
  if (!projectId) return null;

  return `https://${projectId}.supabase.co/storage/v1/object/public/products/${key}`;
}

export function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
