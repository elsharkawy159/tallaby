/**
 * Store-host lookups for proxy.ts, which runs on every request and can't
 * use `unstable_cache`. Results are kept in memory per server instance for a
 * short while, so a domain going live (or being removed), or a store's
 * default language changing, shows up within a minute without a database
 * query per request.
 */

import {
  findStoreHostByCustomDomain,
  findStoreHostBySubdomain,
  type StoreHostInfo,
} from "@workspace/lib/storefront/server";

const HIT_TTL_MS = 60_000;
const MISS_TTL_MS = 30_000;
const MAX_ENTRIES = 5_000;

type Entry<T> = { value: T | null; expires: number };

function memo<T>(lookup: (key: string) => Promise<T | null>) {
  const cache = new Map<string, Entry<T>>();
  return async (key: string): Promise<T | null> => {
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && hit.expires > now) return hit.value;

    let value: T | null;
    try {
      value = await lookup(key);
    } catch (error) {
      console.error("Store host lookup failed:", error);
      // Keep serving what we knew rather than taking the store down.
      return hit?.value ?? null;
    }
    if (cache.size >= MAX_ENTRIES) cache.clear();
    cache.set(key, { value, expires: now + (value ? HIT_TTL_MS : MISS_TTL_MS) });
    return value;
  };
}

export type { StoreHostInfo };

/**
 * "faster" → its store: the active custom domain (`faster-eg.com`) the
 * subdomain forwards to, and the store's languages. Null for no such store.
 */
export const storeHostForSubdomain = memo(findStoreHostBySubdomain);

/** `faster-eg.com` → its store ("faster" and its languages), for an active custom domain of an approved store. */
export const storeHostForCustomDomain = memo(findStoreHostByCustomDomain);
