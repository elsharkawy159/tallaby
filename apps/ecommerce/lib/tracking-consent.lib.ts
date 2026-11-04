/**
 * Pure rules for the tracking consent shared by seller stores (their own apps,
 * D19) and tallaby.com (Tallaby's GA4 and Meta Pixel, F-70a). The browser side
 * is tracking-consent.client.ts.
 *
 * Anything but an explicit "granted" means no tags. A visitor who ignores the
 * banner stays "unset", which sends nothing.
 */
export type TrackingConsent = "granted" | "denied" | "unset";

export function parseTrackingConsent(value: string | null | undefined): TrackingConsent {
  return value === "granted" || value === "denied" ? value : "unset";
}

/** Should the banner be on screen? Always while undecided; otherwise only when reopened from "Cookie settings". */
export function shouldShowConsentBanner(consent: TrackingConsent | "pending", settingsOpen: boolean): boolean {
  if (consent === "pending") return false;
  return consent === "unset" || settingsOpen;
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
