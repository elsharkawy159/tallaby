import { unstable_cache } from "next/cache";
import { stableKey } from "./key";

/**
 * Config for a single cached data-access function.
 */
export interface CachedQueryConfig<A extends readonly unknown[], R> {
  /** Stable key prefix, unique per query shape (e.g. "product:by-slug"). */
  name: string;
  /** Backstop TTL in seconds — see packages/cache/src/profiles.ts. */
  ttl: number;
  /** Tags this query's result depends on, derived from its arguments. */
  tags: (...args: A) => readonly string[];
  /** The actual query. Must not read cookies()/headers() — Next throws if it does. */
  query: (...args: A) => Promise<R>;
}

/**
 * Wraps a data-access function in Next's Data Cache with a deterministic,
 * order-independent key and typed tags.
 *
 * This is the ONLY sanctioned way to call unstable_cache in this monorepo —
 * every cached query in apps/{ecommerce,dashboard,admin} goes through this
 * helper so the key derivation and tag wiring can't drift between call
 * sites. Do not call unstable_cache directly.
 */
export function createCachedQuery<A extends readonly unknown[], R>(
  cfg: CachedQueryConfig<A, R>
): (...args: A) => Promise<R> {
  return (...args: A) => {
    const cached = unstable_cache(cfg.query, [cfg.name, stableKey(...args)], {
      tags: [...cfg.tags(...args)],
      revalidate: cfg.ttl,
    });
    return cached(...args);
  };
}
