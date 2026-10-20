import { hasDangerousScheme, isHttpOrRelativeUrl } from "../config/url";

/**
 * A seller-entered link, or null when it must not render: only http(s),
 * same-origin paths, in-page anchors, `tel:`, `mailto:` and WhatsApp.
 */
export function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (!href || href.length > 2048 || hasDangerousScheme(href)) return null;
  if (isHttpOrRelativeUrl(href)) return href;
  if (/^#[A-Za-z][\w-]*$/.test(href)) return href;
  if (/^tel:\+?[\d\s-]{3,20}$/.test(href)) return href.replace(/\s/g, "");
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href)) return href;
  return null;
}

/** True for absolute links that leave the store (rendered with rel="noopener"). */
export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

/** wa.me link for an Egyptian mobile (01xxxxxxxxx) or an international number. */
export function whatsappHref(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const international = digits.startsWith("0") && digits.length === 11 ? `20${digits.slice(1)}` : digits;
  return /^\d{8,15}$/.test(international) ? `https://wa.me/${international}` : null;
}
