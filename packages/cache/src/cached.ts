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
  /**
   * The result is built from code (e.g. the code-only templates and section
   * designs), so it must change with every deploy: the key gets the deploy id.
   * Next's Data Cache outlives a deploy, so without this a 24 h entry could
   * keep serving what the previous code built.
   */
  perDeploy?: boolean;
}

/** This deploy (Vercel system env), or "local". Part of the key of `perDeploy` queries. */
export const DEPLOY_ID = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || "local";

const cachedQueryWrappers = new Map<string, (...args: unknown[]) => Promise<unknown>>();

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
  const name = cfg.perDeploy ? `${cfg.name}@${DEPLOY_ID}` : cfg.name;
  return (...args: A) => {
    const key = `${name}:${stableKey(...args)}`;
    let cached = cachedQueryWrappers.get(key) as
      | ((...innerArgs: A) => Promise<R>)
      | undefined;

    if (!cached) {
      cached = unstable_cache(cfg.query, [name, stableKey(...args)], {
        tags: [...cfg.tags(...args)],
        revalidate: cfg.ttl,
      }) as (...innerArgs: A) => Promise<R>;
      cachedQueryWrappers.set(
        key,
        cached as unknown as (...args: unknown[]) => Promise<unknown>
      );
    }

    return cached(...args);
  };
}
