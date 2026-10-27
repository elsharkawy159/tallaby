import { createSign } from "node:crypto";
import { createCachedQuery, storeTags } from "@workspace/cache";
import {
  GOOGLE_TOKEN_URL,
  STORE_VIEWS_TIME_ZONE,
  STORE_VIEWS_TTL_SECONDS,
  base64Url,
  dayInZone,
  parseStoreViewsReport,
  readGa4Env,
  serviceAccountJwtInput,
  storeViewsReportBody,
  type Ga4Env,
  type StoreViewsRange,
  type StoreViewsReport,
} from "./store-views.lib";

/**
 * Reads one store's views from Tallaby's GA4 property (PLAN.md SA-01) with a
 * service account; the key never leaves the server. Callers pass a store that
 * requireStore already checked belongs to the session's seller.
 */

export function isStoreViewsConfigured(): boolean {
  return readGa4Env() !== null;
}

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(env: Ga4Env): Promise<string> {
  const now = Date.now();
  if (token && token.expiresAt - 60_000 > now) return token.value;

  const input = serviceAccountJwtInput(env.clientEmail, Math.floor(now / 1000));
  const signature = createSign("RSA-SHA256").update(input).sign(env.privateKey);
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${input}.${base64Url(signature)}`,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GA4 token request failed (${response.status})`);
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("GA4 token response had no access_token");
  token = { value: json.access_token, expiresAt: now + (json.expires_in ?? 3600) * 1000 };
  return token.value;
}

async function fetchStoreViews(storeId: string, range: StoreViewsRange): Promise<StoreViewsReport> {
  const env = readGa4Env();
  if (!env) throw new Error("GA4 is not configured");
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${env.propertyId}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${await accessToken(env)}`, "content-type": "application/json" },
    body: JSON.stringify(storeViewsReportBody(storeId, range)),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`GA4 runReport failed (${response.status})`);
  const now = new Date();
  return parseStoreViewsReport(await response.json(), range, dayInZone(now, STORE_VIEWS_TIME_ZONE), now.toISOString());
}

/**
 * Cached per seller + store + range for an hour; Refresh purges the store's
 * tag. Errors are not cached, so a failed read is retried on the next visit.
 */
export const getStoreViews = createCachedQuery({
  name: "dashboard:store-views:v1",
  ttl: STORE_VIEWS_TTL_SECONDS,
  tags: (sellerId: string, storeId: string, _range: StoreViewsRange) => [storeTags.views(sellerId, storeId)],
  query: (_sellerId: string, storeId: string, range: StoreViewsRange) => fetchStoreViews(storeId, range),
});
