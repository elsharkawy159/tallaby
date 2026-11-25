import { cache } from "react";
import { createCachedQuery, marketingStoreTags } from "@workspace/cache";
import { db, sql } from "@workspace/db";
import { type PlatformCounts, type PlatformStats, toPlatformStats } from "./platform-stats.lib";

/** The strip is optional: past this, the page shows its non-number facts instead of waiting. */
const READ_TIMEOUT_MS = 3000;

/**
 * Three platform-wide counts, nothing per store or per seller: stores created
 * (not deleted), products on sale (active, not in Trash) and real orders (not
 * test orders, F-76).
 */
export async function readPlatformCounts(): Promise<PlatformCounts> {
  const result = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM stores WHERE deleted_at IS NULL) AS stores,
      (SELECT count(*)::int FROM products WHERE status = 'active' AND deleted_at IS NULL) AS products,
      (SELECT count(*)::int FROM orders WHERE is_test IS NOT TRUE) AS orders
  `);
  const row = ([...result] as Record<string, unknown>[])[0] ?? {};
  return { stores: Number(row.stores ?? 0), products: Number(row.products ?? 0), orders: Number(row.orders ?? 0) };
}

/**
 * Read at most once a day for every visitor (the figures are rounded down, so a
 * day-old count is still true). It also clears with the store directory's tag.
 */
const getCachedPlatformCounts = createCachedQuery({
  name: "marketing:platform-stats:v1",
  ttl: 86_400,
  tags: () => [marketingStoreTags.directory()],
  query: () => readPlatformCounts(),
});

/** The home page's stats, rounded down; every figure null when the database can't be read in time. */
export const getPlatformStats = cache(async (): Promise<PlatformStats> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const counts = await Promise.race([
      getCachedPlatformCounts(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`no answer in ${READ_TIMEOUT_MS} ms`)), READ_TIMEOUT_MS);
      }),
    ]);
    return toPlatformStats(counts);
  } catch (error) {
    console.error("[marketing] platform stats failed", error);
    return toPlatformStats(null);
  } finally {
    clearTimeout(timer);
  }
});
