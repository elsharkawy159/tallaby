import { createSign } from "node:crypto";
import {
  GOOGLE_TOKEN_URL,
  base64Url,
  readGa4Env,
  serviceAccountJwtInput,
  type Ga4Env,
} from "./store-views.lib";

/**
 * Server-side access to Tallaby's storefront GA4 property (PLAN.md SA-01).
 * Callers scope reports to stores they have authorized.
 */

export function isStoreViewsConfigured(): boolean {
  return readGa4Env() !== null;
}

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(env: Ga4Env, signal?: AbortSignal): Promise<string> {
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
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw new Error(`GA4 token request failed (${response.status})`);
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("GA4 token response had no access_token");
  token = { value: json.access_token, expiresAt: now + (json.expires_in ?? 3600) * 1000 };
  return token.value;
}

/** One GA4 Data API `runReport` on Tallaby's storefront property; returns the raw JSON. */
export async function runGa4Report(body: unknown, signal?: AbortSignal): Promise<unknown> {
  const env = readGa4Env();
  if (!env) throw new Error("GA4 is not configured");
  const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${env.propertyId}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${await accessToken(env, signal)}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw new Error(`GA4 runReport failed (${response.status})`);
  return response.json();
}
