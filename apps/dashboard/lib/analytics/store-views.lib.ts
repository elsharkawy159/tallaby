/**
 * Store views from Tallaby's GA4 property (PLAN.md SA-01). Pure: env parsing,
 * the GA4 Data API request and its response. The storefront tag sends a
 * `store_id` event parameter, registered in GA4 as the event-scoped custom
 * dimension `customEvent:store_id` (docs/store-views.md).
 */

export const STORE_VIEWS_RANGES = [7, 28, 90] as const;
export type StoreViewsRange = (typeof STORE_VIEWS_RANGES)[number];
export const DEFAULT_STORE_VIEWS_RANGE: StoreViewsRange = 28;

/** Cache backstop: GA4 data lags by minutes to hours, so hourly is enough. */
export const STORE_VIEWS_TTL_SECONDS = 3600;
/** Minimum gap between two Refresh presses for one store. */
export const STORE_VIEWS_REFRESH_COOLDOWN_MS = 60_000;

export const STORE_ID_DIMENSION = "customEvent:store_id";
/** The GA4 property's reporting time zone; GA4's "today" is a day in this zone. */
export const STORE_VIEWS_TIME_ZONE = "Africa/Cairo";

export function parseStoreViewsRange(value: unknown): StoreViewsRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (STORE_VIEWS_RANGES as readonly number[]).includes(n) ? (n as StoreViewsRange) : DEFAULT_STORE_VIEWS_RANGE;
}

export type Ga4Env = { propertyId: string; clientEmail: string; privateKey: string };

/**
 * GA4_PROPERTY_ID (numeric), GA4_SERVICE_ACCOUNT_EMAIL and
 * GA4_SERVICE_ACCOUNT_PRIVATE_KEY (PEM; `\n` escapes allowed). Null when any
 * is missing, and the page then says analytics is not set up yet.
 */
export function readGa4Env(env: Record<string, string | undefined> = process.env): Ga4Env | null {
  const propertyId = env.GA4_PROPERTY_ID?.trim() ?? "";
  const clientEmail = env.GA4_SERVICE_ACCOUNT_EMAIL?.trim() ?? "";
  const privateKey = (env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY ?? "").replace(/\\n/g, "\n").trim();
  if (!/^\d+$/.test(propertyId) || !clientEmail || !privateKey.includes("PRIVATE KEY")) return null;
  return { propertyId, clientEmail, privateKey };
}

export function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/** The unsigned `header.claims` part of the service-account JWT. */
export function serviceAccountJwtInput(clientEmail: string, nowSeconds: number): string {
  const header = { alg: "RS256", typ: "JWT" };
  const claims = { iss: clientEmail, scope: GA4_SCOPE, aud: GOOGLE_TOKEN_URL, iat: nowSeconds, exp: nowSeconds + 3600 };
  return `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claims))}`;
}

/** runReport body: daily views and visitors of one store, with true totals. */
export function storeViewsReportBody(storeId: string, days: StoreViewsRange) {
  return {
    dateRanges: [{ startDate: `${days - 1}daysAgo`, endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
    dimensionFilter: {
      filter: { fieldName: STORE_ID_DIMENSION, stringFilter: { matchType: "EXACT", value: storeId } },
    },
    metricAggregations: ["TOTAL"],
    orderBys: [{ dimension: { dimensionName: "date" } }],
    limit: 400,
  };
}

export type StoreViewsDay = { day: string; views: number; visitors: number };

export type StoreViewsReport = {
  range: StoreViewsRange;
  views: number;
  visitors: number;
  daily: StoreViewsDay[];
  /** ISO time the numbers were read from GA4 (shown as "Updated …"). */
  fetchedAt: string;
};

type Ga4Row = { dimensionValues?: { value?: string }[]; metricValues?: { value?: string }[] };
type Ga4Response = { rows?: Ga4Row[]; totals?: Ga4Row[] };

const toInt = (value: string | undefined) => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** `YYYY-MM-DD` of `date` in the property's time zone. */
export function dayInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** The `days` calendar days ending on `today` (`YYYY-MM-DD`), oldest first. */
export function rangeDays(today: string, days: number): string[] {
  const end = Date.parse(`${today}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) => new Date(end - (days - 1 - i) * 86_400_000).toISOString().slice(0, 10));
}

/**
 * Turns a runReport response into the dashboard report. Days with no hit are
 * missing from GA4's rows, so every day of the range is filled with zeros.
 */
export function parseStoreViewsReport(
  json: unknown,
  range: StoreViewsRange,
  today: string,
  fetchedAt: string,
): StoreViewsReport {
  const response = (json ?? {}) as Ga4Response;
  const byDay = new Map<string, StoreViewsDay>();
  for (const row of response.rows ?? []) {
    const raw = row.dimensionValues?.[0]?.value ?? "";
    if (!/^\d{8}$/.test(raw)) continue;
    const day = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
    byDay.set(day, { day, views: toInt(row.metricValues?.[0]?.value), visitors: toInt(row.metricValues?.[1]?.value) });
  }
  const daily = rangeDays(today, range).map((day) => byDay.get(day) ?? { day, views: 0, visitors: 0 });
  const total = response.totals?.[0];
  const views = total ? toInt(total.metricValues?.[0]?.value) : daily.reduce((sum, d) => sum + d.views, 0);
  // Visitors are unique over the range; summing days would count a returning visitor twice.
  const visitors = total ? toInt(total.metricValues?.[1]?.value) : Math.max(0, ...daily.map((d) => d.visitors));
  return { range, views, visitors, daily, fetchedAt };
}
