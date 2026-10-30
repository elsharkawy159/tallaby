/**
 * Campaign tracking (ROADMAP.md F-26a). Pure helpers shared by the storefront
 * (first-touch capture into a host-only cookie), checkout (copy it onto the
 * order as `orders.metadata.utm`) and the dashboard (link builder, report).
 *
 * The value comes from the shopper's browser, so it is only ever used for
 * reporting: every field is re-sanitized when read, length-capped, and never
 * drives prices, access or anything else.
 */

/** Host-only first-party cookie on the store's own host. */
export const CAMPAIGN_COOKIE = "tallaby_utm";
export const CAMPAIGN_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
/** Encoded cookie value cap (well under the 4 KB browser limit). */
export const CAMPAIGN_COOKIE_MAX_LENGTH = 1500;

export const UTM_FIELDS = ["source", "medium", "campaign", "content", "term"] as const;
export type UtmField = (typeof UTM_FIELDS)[number];

/** Ad click ids we record as present or not (never their value). */
export const CLICK_ID_PARAMS = ["fbclid", "ttclid", "gclid"] as const;
export type ClickIdParam = (typeof CLICK_ID_PARAMS)[number];

export const CAMPAIGN_VALUE_MAX = 100;
export const CAMPAIGN_PATH_MAX = 200;
export const CAMPAIGN_HOST_MAX = 100;

/** The first touch: what brought the shopper to the store. */
export type CampaignTouch = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  clickIds?: ClickIdParam[];
  /** Path of the first page (no query string). */
  landingPath?: string;
  /** Host of an outside referrer, without `www.`. */
  referrerHost?: string;
  /** When it was captured (ISO). */
  at?: string;
};

/** Orders without any touch (direct visits, or placed before F-26a). */
export const DIRECT_SOURCE = "direct";

/* ---------------------------------------------------------------- sanitizing */

const DISALLOWED = /[^\p{L}\p{M}\p{N} ._\-+@/:|#~()]/gu;

/** Trimmed, safe characters only, whitespace collapsed, capped; empty → undefined. */
export function sanitizeCampaignValue(value: unknown, max = CAMPAIGN_VALUE_MAX): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value
    .normalize("NFKC")
    .replace(DISALLOWED, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max)
    .trim();
  return clean || undefined;
}

const HOST_RE = /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9-]{2,63}$/;

/** `WWW.Facebook.com:443.` → `facebook.com`; anything not a hostname → undefined. */
export function sanitizeHost(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const host = value
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "")
    .replace(/^www\./, "");
  if (!host || host.length > CAMPAIGN_HOST_MAX || !HOST_RE.test(host)) return undefined;
  return host;
}

/** A URL path without query or hash, URL-safe characters only. */
export function sanitizePath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const path = value.split(/[?#]/, 1)[0]!.trim();
  if (!path.startsWith("/")) return undefined;
  const clean = path.replace(/[^A-Za-z0-9\-._~/%]/g, "").slice(0, CAMPAIGN_PATH_MAX);
  return clean || undefined;
}

function sanitizeAt(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 40) return undefined;
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

/** True when the touch says where the shopper came from. */
export function hasCampaignSignal(touch: CampaignTouch | null | undefined): touch is CampaignTouch {
  if (!touch) return false;
  return Boolean(
    UTM_FIELDS.some((f) => touch[f]) || (touch.clickIds && touch.clickIds.length) || touch.referrerHost,
  );
}

/**
 * Rebuilds a touch from untrusted input (a decoded cookie), keeping only
 * known keys with safe values. Source and medium are lower-cased so the
 * report groups `Facebook` and `facebook` together.
 */
export function sanitizeCampaignTouch(input: unknown): CampaignTouch | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const raw = input as Record<string, unknown>;
  const touch: CampaignTouch = {};
  for (const field of UTM_FIELDS) {
    const value = sanitizeCampaignValue(raw[field]);
    if (value) touch[field] = field === "source" || field === "medium" ? value.toLowerCase() : value;
  }
  if (Array.isArray(raw.clickIds)) {
    const ids = CLICK_ID_PARAMS.filter((id) => (raw.clickIds as unknown[]).includes(id));
    if (ids.length) touch.clickIds = ids;
  }
  const landingPath = sanitizePath(raw.landingPath);
  if (landingPath) touch.landingPath = landingPath;
  const referrerHost = sanitizeHost(raw.referrerHost);
  if (referrerHost) touch.referrerHost = referrerHost;
  const at = sanitizeAt(raw.at);
  if (at) touch.at = at;
  return hasCampaignSignal(touch) ? touch : null;
}

/* ------------------------------------------------------------------ capture */

/**
 * The touch of a page load, or null when it carries no campaign signal (a
 * direct visit or a page of the same site), so a later ad click still counts
 * as the first touch.
 */
export function parseCampaignTouch(input: {
  search: string;
  pathname: string;
  referrer?: string | null;
  ownHost: string;
  now?: Date;
}): CampaignTouch | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(input.search);
  } catch {
    params = new URLSearchParams();
  }
  const raw: Record<string, unknown> = {};
  for (const field of UTM_FIELDS) raw[field] = params.get(`utm_${field}`) ?? undefined;
  raw.clickIds = CLICK_ID_PARAMS.filter((id) => (params.get(id) ?? "").trim() !== "");
  raw.landingPath = input.pathname;

  if (input.referrer) {
    try {
      const ref = new URL(input.referrer);
      const refHost = sanitizeHost(ref.hostname);
      const ownHost = sanitizeHost(input.ownHost);
      if ((ref.protocol === "http:" || ref.protocol === "https:") && refHost && refHost !== ownHost) {
        raw.referrerHost = refHost;
      }
    } catch {
      // Not a URL: no referrer.
    }
  }
  raw.at = (input.now ?? new Date()).toISOString();
  return sanitizeCampaignTouch(raw);
}

/** Cookie value for a touch, or null when it can't be made small enough. */
export function encodeCampaignCookie(touch: CampaignTouch): string | null {
  const clean = sanitizeCampaignTouch(touch);
  if (!clean) return null;
  // Arabic text grows ~6x when URL-encoded: drop the least useful fields first.
  const drops: (keyof CampaignTouch)[] = ["term", "content", "landingPath", "medium", "campaign"];
  const candidate: CampaignTouch = { ...clean };
  for (let i = 0; i <= drops.length; i++) {
    const value = encodeURIComponent(JSON.stringify(candidate));
    if (value.length <= CAMPAIGN_COOKIE_MAX_LENGTH) return hasCampaignSignal(candidate) ? value : null;
    const drop = drops[i];
    if (drop) delete candidate[drop];
  }
  return null;
}

/** Reads the cookie back; anything malformed or oversized → null. */
export function decodeCampaignCookie(value: string | null | undefined): CampaignTouch | null {
  if (!value || value.length > CAMPAIGN_COOKIE_MAX_LENGTH) return null;
  try {
    return sanitizeCampaignTouch(JSON.parse(decodeURIComponent(value)));
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------- attribution */

/** Common spellings of a source → one name. */
const SOURCE_ALIASES: Record<string, string> = {
  fb: "facebook",
  "facebook.com": "facebook",
  meta: "facebook",
  ig: "instagram",
  insta: "instagram",
  "instagram.com": "instagram",
  tt: "tiktok",
  "tik tok": "tiktok",
  "tiktok.com": "tiktok",
  wa: "whatsapp",
  "whats app": "whatsapp",
  "whatsapp.com": "whatsapp",
  "google.com": "google",
  yt: "youtube",
  "youtube.com": "youtube",
  snap: "snapchat",
  twitter: "x",
};

/** Referrer hosts (and their subdomains) that mean a known source. */
const REFERRER_SOURCES: [suffix: string, source: string][] = [
  ["facebook.com", "facebook"],
  ["fb.com", "facebook"],
  ["fb.me", "facebook"],
  ["messenger.com", "facebook"],
  ["instagram.com", "instagram"],
  ["tiktok.com", "tiktok"],
  ["whatsapp.com", "whatsapp"],
  ["wa.me", "whatsapp"],
  ["youtube.com", "youtube"],
  ["youtu.be", "youtube"],
  ["snapchat.com", "snapchat"],
  ["x.com", "x"],
  ["t.co", "x"],
  ["twitter.com", "x"],
  ["bing.com", "bing"],
  ["telegram.org", "telegram"],
  ["t.me", "telegram"],
];

const CLICK_ID_SOURCES: Record<ClickIdParam, string> = {
  fbclid: "facebook",
  ttclid: "tiktok",
  gclid: "google",
};

function sourceFromHost(host: string): string {
  if (/(^|\.)google\.[a-z.]+$/.test(host)) return "google";
  for (const [suffix, source] of REFERRER_SOURCES) {
    if (host === suffix || host.endsWith(`.${suffix}`)) return source;
  }
  return host;
}

/**
 * Where an order came from for the report: utm_source (aliases merged), else
 * the ad click id, else the referrer site, else "direct".
 */
export function campaignSource(touch: CampaignTouch | null | undefined): string {
  if (!touch) return DIRECT_SOURCE;
  if (touch.source) {
    const key = touch.source.toLowerCase();
    return SOURCE_ALIASES[key] ?? sourceFromHost(key);
  }
  const clickId = touch.clickIds?.[0];
  if (clickId) return CLICK_ID_SOURCES[clickId];
  if (touch.referrerHost) return sourceFromHost(touch.referrerHost);
  return DIRECT_SOURCE;
}

/* ------------------------------------------------------------- link builder */

export const CAMPAIGN_PRESETS = {
  facebook: { source: "facebook", medium: "paid_social" },
  instagram: { source: "instagram", medium: "paid_social" },
  tiktok: { source: "tiktok", medium: "paid_social" },
  whatsapp: { source: "whatsapp", medium: "chat" },
  influencer: { source: "", medium: "influencer" },
} as const;
export type CampaignPreset = keyof typeof CAMPAIGN_PRESETS;
export const CAMPAIGN_PRESET_KEYS = Object.keys(CAMPAIGN_PRESETS) as CampaignPreset[];

/** `Eid Sale 2026!` → `eid-sale-2026` (Arabic letters kept). */
export function slugifyCampaignValue(value: string): string {
  return (sanitizeCampaignValue(value) ?? "")
    .toLowerCase()
    .replace(/[\s/|#~()+:@]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
}

export type CampaignLinkInput = {
  source: string;
  medium?: string;
  campaign: string;
  content?: string;
  term?: string;
};

export type CampaignLinkResult =
  | { ok: true; url: string }
  | { ok: false; error: "invalidUrl" | "missingSource" | "missingCampaign" };

/**
 * The page URL with utm_* parameters (old utm_* replaced, other parameters
 * kept). Values are slugified, so what the report shows matches the link.
 */
export function buildCampaignUrl(base: string, input: CampaignLinkInput): CampaignLinkResult {
  let url: URL;
  try {
    url = new URL(base.trim());
  } catch {
    return { ok: false, error: "invalidUrl" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, error: "invalidUrl" };
  const source = slugifyCampaignValue(input.source);
  if (!source) return { ok: false, error: "missingSource" };
  const campaign = slugifyCampaignValue(input.campaign);
  if (!campaign) return { ok: false, error: "missingCampaign" };

  for (const field of UTM_FIELDS) url.searchParams.delete(`utm_${field}`);
  const values: Record<UtmField, string> = {
    source,
    medium: slugifyCampaignValue(input.medium ?? ""),
    campaign,
    content: slugifyCampaignValue(input.content ?? ""),
    term: slugifyCampaignValue(input.term ?? ""),
  };
  for (const field of UTM_FIELDS) {
    if (values[field]) url.searchParams.set(`utm_${field}`, values[field]);
  }
  url.hash = "";
  return { ok: true, url: url.toString() };
}
