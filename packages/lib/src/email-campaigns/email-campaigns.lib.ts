/**
 * Store email campaigns and win-back emails (ROADMAP.md F-16a, F-16e; 0129).
 * Pure rules, safe on the client: content limits and validation, audiences,
 * recipient filtering, sending caps, win-back settings and eligibility, and
 * the unsubscribe link. The database side is email-campaigns.server.ts; the
 * cron is email-campaigns-send.server.ts; the email itself is
 * `StoreCampaignEmail` in packages/emails (rendered by apps/backend).
 *
 * Sender reputation and cost (conservative defaults, per store):
 * - 1 campaign queued per rolling 24 hours;
 * - at most 500 recipients per campaign (the newest customers first);
 * - 5 test sends per campaign (to the seller's own account email only);
 * - win-back: at most 50 emails per store per day, only to customers who
 *   bought (a delivered order) and whose last order is 90 (N) to 365 days old.
 * Nothing is ever sent to an unsubscribed email, a guest placeholder
 * (`@temp.local`) or a customer whose phone is on the store's blocklist.
 * Links are not allowed in the subject or text (the button and product
 * cards link to the store's own site): it keeps phishing out of Tallaby's
 * sending domain.
 */
import { normalizeAudienceEmail } from "../audiences/audiences.lib";
import type { StoreCustomer } from "../customers/customers.lib";
import { resolvePlanId, type PlanId } from "../plans";

export const CAMPAIGN_SUBJECT_MAX = 150;
export const CAMPAIGN_BODY_MAX = 5000;
export const CAMPAIGN_CTA_MAX = 40;
export const CAMPAIGN_PRODUCTS_MAX = 4;

export const CAMPAIGN_AUDIENCES = ["subscribers", "buyers", "all", "inactive"] as const;
export type CampaignAudience = (typeof CAMPAIGN_AUDIENCES)[number];
export const parseCampaignAudience = (value: unknown): CampaignAudience =>
  CAMPAIGN_AUDIENCES.includes(value as CampaignAudience) ? (value as CampaignAudience) : "subscribers";

export const CAMPAIGN_STATUSES = ["draft", "scheduled", "sending", "sent", "cancelled"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const INACTIVE_DAYS_DEFAULT = 90;
export const INACTIVE_DAYS_MIN = 7;
export const INACTIVE_DAYS_MAX = 730;

/** Per-plan sending limits (every plan is Free today; see the header). */
export type EmailCampaignLimits = {
  campaignsPerDay: number;
  maxRecipients: number;
  testSendsPerCampaign: number;
  winbackPerStorePerDay: number;
};

export const EMAIL_CAMPAIGN_LIMITS: Record<PlanId, EmailCampaignLimits> = {
  free: { campaignsPerDay: 1, maxRecipients: 500, testSendsPerCampaign: 5, winbackPerStorePerDay: 50 },
};

export function emailCampaignLimits(plan: string | null | undefined): EmailCampaignLimits {
  return EMAIL_CAMPAIGN_LIMITS[resolvePlanId(plan)];
}

/** Cron: emails per run across every store (the route has 300 s; each send is one backend call). */
export const EMAIL_CRON_MAX_PER_RUN = 1500;
/** Cron: rows claimed per batch, sent with EMAIL_CRON_CONCURRENCY parallel calls. */
export const EMAIL_CRON_BATCH = 20;
export const EMAIL_CRON_CONCURRENCY = 4;
/** A send is given up ('failed') after this many tries. */
export const EMAIL_SEND_MAX_ATTEMPTS = 3;
/** A row claimed longer ago than this (a crashed run) can be claimed again. */
export const EMAIL_CLAIM_STALE_MINUTES = 30;
/** Win-back never writes to customers whose last order is older than this. */
export const WINBACK_MAX_INACTIVE_DAYS = 365;
/** Stores whose win-back is planned per cron run. */
export const WINBACK_STORES_PER_RUN = 200;

const URL_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|me|co|eg|info|link|xyz|app|shop|store)\b)/i;
// Control characters except tab and line feed.
// eslint-disable-next-line no-control-regex
const CONTROL_RE = /[\u0000-\u0008\u000b-\u001f\u007f‎‏‪-‮⁦-⁩]/g;

/** One line of text: trimmed, single spaces, no control characters. */
export function cleanLine(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(CONTROL_RE, "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Body text: CRLF → LF, no control characters, at most two blank lines in a row, trimmed. */
export function cleanBody(value: unknown, max = CAMPAIGN_BODY_MAX): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_RE, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

export const hasLink = (text: string) => URL_RE.test(text);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID_RE.test(value);

export function clampInactiveDays(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return INACTIVE_DAYS_DEFAULT;
  return Math.min(INACTIVE_DAYS_MAX, Math.max(INACTIVE_DAYS_MIN, Math.round(n)));
}

export type CampaignContent = {
  subject: string;
  body: string;
  ctaLabel: string | null;
  productIds: string[];
  audience: CampaignAudience;
  /** Only for the 'inactive' audience; null otherwise. */
  inactiveDays: number | null;
};

export type CampaignInputError = "subjectLink" | "bodyLink" | "ctaLink";

/**
 * A draft from the composer, cleaned. Empty subject/body are fine for a
 * draft (checked by `campaignSendError`); links never are.
 */
export function parseCampaignInput(input: unknown): { ok: true; value: CampaignContent } | { ok: false; error: CampaignInputError } {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const subject = cleanLine(raw.subject, CAMPAIGN_SUBJECT_MAX);
  const body = cleanBody(raw.body);
  const ctaLabel = cleanLine(raw.ctaLabel, CAMPAIGN_CTA_MAX) || null;
  if (hasLink(subject)) return { ok: false, error: "subjectLink" };
  if (hasLink(body)) return { ok: false, error: "bodyLink" };
  if (ctaLabel && hasLink(ctaLabel)) return { ok: false, error: "ctaLink" };
  const ids = Array.isArray(raw.productIds) ? raw.productIds : [];
  const productIds = [...new Set(ids.filter(isUuid).map((id) => id.toLowerCase()))].slice(0, CAMPAIGN_PRODUCTS_MAX);
  const audience = parseCampaignAudience(raw.audience);
  return {
    ok: true,
    value: {
      subject,
      body,
      ctaLabel,
      productIds,
      audience,
      inactiveDays: audience === "inactive" ? clampInactiveDays(raw.inactiveDays) : null,
    },
  };
}

export type CampaignSendError = "subjectRequired" | "bodyRequired" | CampaignInputError;

/** What stops a saved draft from being sent (null = ready). */
export function campaignSendError(content: Pick<CampaignContent, "subject" | "body" | "ctaLabel">): CampaignSendError | null {
  if (!content.subject.trim()) return "subjectRequired";
  if (!content.body.trim()) return "bodyRequired";
  if (hasLink(content.subject)) return "subjectLink";
  if (hasLink(content.body)) return "bodyLink";
  if (content.ctaLabel && hasLink(content.ctaLabel)) return "ctaLink";
  return null;
}

/**
 * The customers an audience reaches (subscribers come from another table).
 * - buyers: at least one delivered order;
 * - all: every customer;
 * - inactive: customers whose last order is at least `inactiveDays` old.
 */
export function customersForAudience(
  customers: readonly StoreCustomer[],
  audience: Exclude<CampaignAudience, "subscribers">,
  options: { now: Date; inactiveDays?: number | null },
): StoreCustomer[] {
  if (audience === "buyers") return customers.filter((c) => c.deliveredCount > 0);
  if (audience === "inactive") {
    const days = clampInactiveDays(options.inactiveDays ?? INACTIVE_DAYS_DEFAULT);
    const cutoff = options.now.getTime() - days * 86_400_000;
    return customers.filter((c) => {
      const last = Date.parse(c.lastOrderAt);
      return Number.isFinite(last) && last <= cutoff;
    });
  }
  return [...customers];
}

export type RecipientList = {
  /** Lower-cased, de-duplicated, in input order, at most `max`. */
  emails: string[];
  /** Addresses on the store's unsubscribe list. */
  unsubscribed: number;
  /** Contacts with no usable email (none, malformed or a guest placeholder). */
  noEmail: number;
  /** Valid addresses left out because of the per-campaign cap. */
  overCap: number;
};

/**
 * Turns raw contact emails (newest first) into the send list: normalised,
 * de-duplicated, minus unsubscribed and placeholder addresses, capped.
 */
export function buildRecipientList(
  rawEmails: ReadonlyArray<string | null | undefined>,
  options: { unsubscribed: ReadonlySet<string>; max: number },
): RecipientList {
  const seen = new Set<string>();
  const out: RecipientList = { emails: [], unsubscribed: 0, noEmail: 0, overCap: 0 };
  for (const raw of rawEmails) {
    const email = normalizeAudienceEmail(raw);
    if (!email) {
      out.noEmail++;
      continue;
    }
    if (seen.has(email)) continue;
    seen.add(email);
    if (options.unsubscribed.has(email)) {
      out.unsubscribed++;
      continue;
    }
    if (out.emails.length >= options.max) {
      out.overCap++;
      continue;
    }
    out.emails.push(email);
  }
  return out;
}

/** Whether another campaign may be queued, given how many the store queued in the last 24 hours. */
export const canQueueCampaign = (queuedLast24h: number, limits: EmailCampaignLimits) =>
  queuedLast24h < limits.campaignsPerDay;

/** A campaign can be scheduled at most this far ahead. */
export const CAMPAIGN_SCHEDULE_MAX_DAYS = 30;

/**
 * The composer's "schedule for" value (an ISO string): null = send now; a
 * Date in the future (at least 5 minutes, at most CAMPAIGN_SCHEDULE_MAX_DAYS);
 * "invalid" otherwise.
 */
export function parseScheduledAt(value: unknown, now: Date): Date | null | "invalid" {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return "invalid";
  const at = Date.parse(value);
  if (!Number.isFinite(at)) return "invalid";
  if (at < now.getTime() + 5 * 60_000) return "invalid";
  if (at > now.getTime() + CAMPAIGN_SCHEDULE_MAX_DAYS * 86_400_000) return "invalid";
  return new Date(at);
}

/** After a failed send: try again later, or give up after EMAIL_SEND_MAX_ATTEMPTS. */
export const statusAfterFailure = (attempts: number): "pending" | "failed" =>
  attempts >= EMAIL_SEND_MAX_ATTEMPTS ? "failed" : "pending";

/** The email chrome language: the store's default, Arabic unless it is English. */
export const campaignLocale = (value: unknown): "ar" | "en" => (value === "en" ? "en" : "ar");

// ---------------------------------------------------------------------------
// Win-back (F-16e): stores.settings.winback = { enabled, days, subject, body }

export type WinbackSettings = {
  enabled: boolean;
  days: number;
  /** Empty = the default copy in the store's language. */
  subject: string;
  body: string;
};

export const WINBACK_DEFAULTS: WinbackSettings = { enabled: false, days: INACTIVE_DAYS_DEFAULT, subject: "", body: "" };
export const WINBACK_DAYS_MIN = 30;
export const WINBACK_DAYS_MAX = 365;

const clampWinbackDays = (value: unknown) => {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(n)) return INACTIVE_DAYS_DEFAULT;
  return Math.min(WINBACK_DAYS_MAX, Math.max(WINBACK_DAYS_MIN, Math.round(n)));
};

/** The store's win-back settings from `stores.settings`, re-validated (links dropped). */
export function parseWinbackSettings(settings: unknown): WinbackSettings {
  const raw = (settings as { winback?: unknown } | null | undefined)?.winback;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...WINBACK_DEFAULTS };
  const value = raw as Record<string, unknown>;
  const subject = cleanLine(value.subject, CAMPAIGN_SUBJECT_MAX);
  const body = cleanBody(value.body, CAMPAIGN_BODY_MAX);
  return {
    enabled: value.enabled === true,
    days: clampWinbackDays(value.days),
    subject: hasLink(subject) ? "" : subject,
    body: hasLink(body) ? "" : body,
  };
}

export type WinbackInputError = "subjectLink" | "bodyLink";

/** The settings card's input, cleaned; links are refused. */
export function parseWinbackInput(input: unknown): { ok: true; value: WinbackSettings } | { ok: false; error: WinbackInputError } {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const subject = cleanLine(raw.subject, CAMPAIGN_SUBJECT_MAX);
  const body = cleanBody(raw.body, CAMPAIGN_BODY_MAX);
  if (hasLink(subject)) return { ok: false, error: "subjectLink" };
  if (hasLink(body)) return { ok: false, error: "bodyLink" };
  return { ok: true, value: { enabled: raw.enabled === true, days: clampWinbackDays(raw.days), subject, body } };
}

/**
 * Whether a customer gets a win-back email now: bought before (a delivered
 * order), has a real email, and the last order is between `days` and
 * WINBACK_MAX_INACTIVE_DAYS old. "Once per period" is the unique
 * store + email + last order date in the database.
 */
export function isWinbackEligible(customer: Pick<StoreCustomer, "deliveredCount" | "email" | "lastOrderAt">, options: { now: Date; days: number }): boolean {
  if (customer.deliveredCount < 1) return false;
  if (!normalizeAudienceEmail(customer.email)) return false;
  const last = Date.parse(customer.lastOrderAt);
  if (!Number.isFinite(last)) return false;
  const age = options.now.getTime() - last;
  return age >= options.days * 86_400_000 && age <= WINBACK_MAX_INACTIVE_DAYS * 86_400_000;
}

/**
 * The customers to plan win-back emails for, oldest-inactive last: eligible,
 * not unsubscribed, one per email, at most `max`.
 */
export function selectWinbackCustomers(
  customers: readonly StoreCustomer[],
  options: { now: Date; days: number; unsubscribed: ReadonlySet<string>; blockedPhones?: ReadonlySet<string>; max: number },
): Array<{ email: string; lastOrderAt: string }> {
  const out: Array<{ email: string; lastOrderAt: string }> = [];
  const seen = new Set<string>();
  for (const customer of customers) {
    if (out.length >= options.max) break;
    if (!isWinbackEligible(customer, options)) continue;
    if (customer.phone && options.blockedPhones?.has(customer.phone)) continue;
    const email = normalizeAudienceEmail(customer.email)!;
    if (seen.has(email) || options.unsubscribed.has(email)) continue;
    seen.add(email);
    out.push({ email, lastOrderAt: customer.lastOrderAt });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Unsubscribe

const TOKEN_RE = /^[0-9a-f]{32,128}$/;
export const isEmailUnsubscribeToken = (value: unknown): value is string => typeof value === "string" && TOKEN_RE.test(value);

/** The unsubscribe link on the store's own origin (`/api` is served on every store host). */
export function emailUnsubscribeUrl(storeOrigin: string, token: string): string {
  return `${storeOrigin.replace(/\/+$/, "")}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;
}
