import { cache } from "react";
import { createCachedQuery, marketingStoreTags } from "@workspace/cache";
import { db, sql } from "@workspace/db";
import { RECENT_STORES_LIMIT, type RecentStore } from "./recent-stores.lib";

/** The line is optional: past this, the page renders without it rather than wait for the database. */
const READ_TIMEOUT_MS = 3000;

/**
 * The newest stores that are really open to visitors: published, active and not
 * deleted, of an approved seller, by first publish (a republish keeps that time,
 * and a draft has none). The schema doesn't mark test or demo stores, so any
 * store that passes these checks can show. Only the public name leaves this
 * function, and nothing about the seller.
 */
export async function readRecentStores(windowDays = 7): Promise<RecentStore[]> {
  const result = await db.execute(sql`
    SELECT st.name, st.first_published_at
    FROM stores st
    JOIN sellers s ON s.id = st.seller_id
    WHERE st.status = 'active' AND st.site_status = 'published' AND st.deleted_at IS NULL
      AND s.status = 'approved'
      AND btrim(st.name) <> ''
      AND st.first_published_at <= now()
      AND st.first_published_at >= now() - make_interval(days => ${windowDays})
    ORDER BY st.first_published_at DESC
    LIMIT ${RECENT_STORES_LIMIT}
  `);
  return ([...result] as Record<string, unknown>[]).map((row) => ({
    name: String(row.name),
    publishedAt: row.first_published_at ? new Date(row.first_published_at as string | Date).toISOString() : null,
  }));
}

/** One short-lived read for every visitor. It holds no customer or seller data. */
const getCachedRecentStores = createCachedQuery({
  name: "marketing:recent-stores:v1",
  ttl: 60,
  tags: () => [marketingStoreTags.recent()],
  query: () => readRecentStores(),
});

/**
 * The stores for the home page's live line, and when they were read, which the
 * page and the browser both start from so their first render matches. Empty (the
 * line hides) if the database cannot be read.
 */
export const getRecentStores = cache(async (): Promise<{ stores: RecentStore[]; readAt: number }> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const stores = await Promise.race([
      getCachedRecentStores(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`no answer in ${READ_TIMEOUT_MS} ms`)), READ_TIMEOUT_MS);
      }),
    ]);
    return { stores, readAt: Date.now() };
  } catch (error) {
    console.error("[marketing] recent stores failed", error);
    return { stores: [], readAt: Date.now() };
  } finally {
    clearTimeout(timer);
  }
});
