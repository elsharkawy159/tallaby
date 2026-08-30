import type { CacheInvalidation } from "./invalidate";

export type AppId = "ecommerce" | "dashboard" | "admin";

/**
 * Resolves the peer apps to notify from environment variables.
 *
 * Each app defines its own base URL var (ECOMMERCE_URL / DASHBOARD_URL /
 * ADMIN_URL). ECOMMERCE_DOMAIN is kept as a fallback for the ecommerce peer
 * because it's the variable the existing deployment already has set.
 */
function peerUrls(from: AppId): Partial<Record<AppId, string>> {
  const all: Record<AppId, string | undefined> = {
    ecommerce: process.env.ECOMMERCE_URL || process.env.ECOMMERCE_DOMAIN,
    dashboard: process.env.DASHBOARD_URL,
    admin: process.env.ADMIN_URL,
  };
  const peers: Partial<Record<AppId, string>> = {};
  for (const [id, url] of Object.entries(all) as [AppId, string | undefined][]) {
    if (id !== from && url) peers[id] = url;
  }
  return peers;
}

interface BroadcastPayload {
  tags: string[];
  paths: CacheInvalidation["paths"];
  from: AppId;
  ts: number;
}

async function postWithTimeout(url: string, body: BroadcastPayload, secret: string) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-revalidate-secret": secret,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) {
    throw new Error(`revalidate webhook responded ${res.status}`);
  }
}

async function postWithRetry(url: string, body: BroadcastPayload, secret: string) {
  try {
    await postWithTimeout(url, body, secret);
  } catch (err) {
    try {
      await postWithTimeout(url, body, secret);
    } catch (retryErr) {
      console.error(
        `[cache] broadcast to ${url} failed twice (from=${body.from}, tags=${body.tags.length}):`,
        retryErr instanceof Error ? retryErr.message : retryErr
      );
    }
  }
}

/**
 * Fans an invalidation out to every OTHER deployment's /api/revalidate
 * route. Never throws into the caller — a dropped broadcast is bounded by
 * the query's TTL (packages/cache/src/profiles.ts), not by this function
 * succeeding. Errors are logged, not swallowed silently.
 */
export async function broadcastInvalidation(
  inv: CacheInvalidation,
  from: AppId
): Promise<void> {
  if (inv.tags.length === 0 && inv.paths.length === 0) return;

  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) {
    console.warn(
      "[cache] REVALIDATE_SECRET not set — skipping cross-app invalidation broadcast"
    );
    return;
  }

  const peers = peerUrls(from);
  const body: BroadcastPayload = { tags: inv.tags, paths: inv.paths, from, ts: Date.now() };

  await Promise.allSettled(
    Object.values(peers)
      .filter((url): url is string => Boolean(url))
      .map((base) => postWithRetry(new URL("/api/revalidate", base).toString(), body, secret))
  );
}
