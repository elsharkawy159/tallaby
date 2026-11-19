/**
 * Pure rules for the tracking consent shared by seller stores (their own apps,
 * D19) and tallaby.com (Tallaby's GA4 and Meta Pixel, F-70a). The browser side
 * is tracking-consent.client.ts.
 *
 * Since 2026-11-12 (owner) there is no cookie pop-up: a visitor who never
 * chose counts as "granted" (tracking-consent.client.ts, storefront-consent.ts),
 * and only an explicit "denied" stops the tags.
 */
export type TrackingConsent = "granted" | "denied" | "unset";

export function parseTrackingConsent(value: string | null | undefined): TrackingConsent {
  return value === "granted" || value === "denied" ? value : "unset";
}

/** Should the banner be on screen? Only when reopened from "Cookie settings" (no pop-up on a first visit, owner 2026-11-12). */
export function shouldShowConsentBanner(consent: TrackingConsent | "pending", settingsOpen: boolean): boolean {
  if (consent === "pending") return false;
  return settingsOpen;
}

// GA4: _ga, _ga_<stream>, _gid, _gat*. Meta: _fbp, _fbc.
const TAG_COOKIE = /^(_ga(_.+)?|_gid|_gat(_.+)?|_fbp|_fbc)$/;

/** The analytics and advertising cookies present in a `document.cookie` string. Essential cookies never match. */
export function tagCookieNames(cookieHeader: string): string[] {
  return cookieHeader
    .split(";")
    .map((part) => part.split("=")[0]?.trim() ?? "")
    .filter((name) => TAG_COOKIE.test(name));
}

/**
 * The Domain values a tag could have set a cookie under on this host: GA and
 * Meta both use the widest one allowed, so www.tallaby.com also tries
 * .tallaby.com. Never a bare public suffix, and nothing for localhost or an IP.
 */
export function tagCookieDomains(hostname: string): string[] {
  const labels = hostname.split(".");
  if (labels.length < 2 || /^[\d.]+$/.test(hostname)) return [];
  const domains: string[] = [];
  for (let i = 0; i <= labels.length - 2; i += 1) domains.push(`.${labels.slice(i).join(".")}`);
  return domains;
}
