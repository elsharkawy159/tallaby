/**
 * Pure helpers for affiliate product-share URLs and coupon query capture.
 * Session I/O and server validation live elsewhere — this module stays
 * isomorphic so Vitest and client components can share one implementation.
 */

/**
 * Normalize a coupon string from a URL or form.
 * Returns null when the value is empty or fails a conservative shape check —
 * existence / eligibility are still validated server-side at apply time.
 */
export function normalizeCouponCode (
  raw: string | null | undefined
): string | null {
  if (raw == null) return null

  const trimmed = raw.trim().toUpperCase()
  if (!trimmed) return null

  // Affiliate codes are alphanumeric (e.g. AHMED10XYZ). Allow _/- for
  // future promo codes without accepting spaces or injection-prone chars.
  if (!/^[A-Z0-9_-]{2,40}$/.test(trimmed)) return null

  return trimmed
}

/**
 * Build a product share URL, optionally attaching `?coupon=`.
 * Uses the URL API so existing query params are preserved and `coupon`
 * is set (not duplicated as a second `?`).
 */
export function buildProductShareUrl (
  baseUrl: string,
  coupon?: string | null
): string {
  let url: URL
  try {
    url = new URL(baseUrl)
  } catch {
    return baseUrl
  }

  const normalized = normalizeCouponCode(coupon)
  if (normalized) {
    url.searchParams.set('coupon', normalized)
  } else {
    url.searchParams.delete('coupon')
  }

  return url.toString()
}

/**
 * Absolute product share URL from origin + pathname (+ optional coupon).
 * Intentionally ignores the current page search string so a visitor's
 * inbound `?coupon=` is never re-shared — only the sharer's own code is added.
 */
export function buildProductShareUrlFromPath (input: {
  origin: string
  pathname: string
  coupon?: string | null
}): string {
  const path = input.pathname.startsWith('/')
    ? input.pathname
    : `/${input.pathname}`
  return buildProductShareUrl(`${input.origin}${path}`, input.coupon)
}
