/**
 * Convert a phone number to the digits-only international form wa.me expects
 * (no `+`, no leading `00`). Egyptian mobiles written locally (`01XXXXXXXXX`)
 * get the `20` country code. Returns null when the input can't be a real
 * number.
 */
export function toWhatsAppNumber(
  phone: string | null | undefined
): string | null {
  if (!phone) return null;

  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  // Local Egyptian mobile: 01XXXXXXXXX or 1XXXXXXXXX
  if (/^01[0125]\d{8}$/.test(digits)) return `20${digits.slice(1)}`;
  if (/^1[0125]\d{8}$/.test(digits)) return `20${digits}`;
  // Egyptian mobile with country code plus a stray trunk zero: 2001XXXXXXXXX
  if (/^2001[0125]\d{8}$/.test(digits)) return `20${digits.slice(3)}`;

  // Any other international number (E.164 allows 8–15 digits)
  if (digits.length >= 8 && digits.length <= 15 && !digits.startsWith("0")) {
    return digits;
  }

  return null;
}

export function buildWhatsAppUrl(
  phone: string | null | undefined,
  text?: string
): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  return text
    ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${number}`;
}

export function buildMailtoUrl(
  email: string | null | undefined,
  options?: { subject?: string; body?: string }
): string | null {
  const address = email?.trim();
  if (!address || !address.includes("@")) return null;

  const params = new URLSearchParams();
  if (options?.subject) params.set("subject", options.subject);
  if (options?.body) params.set("body", options.body);
  // URLSearchParams encodes spaces as "+", which mail clients show literally.
  const query = params.toString().replace(/\+/g, "%20");

  return query ? `mailto:${address}?${query}` : `mailto:${address}`;
}

export function buildTelUrl(phone: string | null | undefined): string | null {
  const cleaned = phone?.replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : null;
}
