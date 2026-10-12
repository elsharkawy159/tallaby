/**
 * Custom-domain lookups for proxy.ts, which runs on every request and can't
 * use `unstable_cache`. Results are kept in memory per server instance for a
 * short while, so a domain going live (or being removed) shows up within a
 * minute without a database query per request.
 */

import {
  findActiveCustomDomainForSubdomain,
  findSubdomainForCustomDomain,
} from "@workspace/lib/storefront/server";

const HIT_TTL_MS = 60_000;
const MISS_TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;

type Entry = { value: string | null; expires: number };

function memo(lookup: (key: string) => Promise<string | null>) {
  const cache = new Map<string, Entry>();
  return async (key: string): Promise<string | null> => {
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && hit.expires > now) return hit.value;

    let value: string | null;
    try {
      value = await lookup(key);
    } catch (error) {
      console.error("Custom domain lookup failed:", error);
      // Keep serving what we knew rather than taking the store down.
      return hit?.value ?? null;
    }
    if (cache.size >= MAX_ENTRIES) cache.clear();
    cache.set(key, { value, expires: now + (value ? HIT_TTL_MS : MISS_TTL_MS) });
    return value;
  };
}

/** `faster-eg.com` → "faster", for an active custom domain of an approved store. */
export const subdomainForCustomDomain = memo(findSubdomainForCustomDomain);

/** "faster" → `faster-eg.com`, when that store has an active custom domain. */
export const customDomainForSubdomain = memo(findActiveCustomDomainForSubdomain);
