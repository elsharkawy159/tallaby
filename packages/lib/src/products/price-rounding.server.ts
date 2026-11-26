import { and, db, eq, isNull, stores } from "@workspace/db";
import { parsePriceRounding, type PriceRoundingRule } from "./price-rounding.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The price rounding rule (ROADMAP.md F-112b) of a store the seller owns, read
 * from `stores.settings.priceRounding` on the server, never from the client.
 * Null when the store is not the seller's (or deleted), has no rule, or the
 * rule is off or invalid: prices are then saved as entered. Not cached (rule
 * 8: a writer must use the rule as it is now). One small indexed read; the
 * bulk writers call it once per request, not once per row.
 */
export async function loadStorePriceRounding(
  sellerId: string,
  storeId: string | null | undefined,
  q: Queryable = db,
): Promise<PriceRoundingRule | null> {
  if (!storeId || !UUID_RE.test(storeId) || !sellerId) return null;
  const [row] = await q
    .select({ settings: stores.settings })
    .from(stores)
    .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
    .limit(1);
  return row ? parsePriceRounding(row.settings) : null;
}
