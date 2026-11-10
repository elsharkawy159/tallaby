/**
 * Reads a platform switch (ROADMAP.md F-87a; `platform_switches`, 0160).
 *
 * Read fresh on every call and never stored in `@workspace/cache` (CLAUDE.md
 * rule 8): when a migration flips a switch, the next request must see it. In a
 * React server render, call the app's `cache()` wrapper instead
 * (apps/dashboard/lib/stores/platform-switches.server.ts,
 * apps/ecommerce/lib/platform-switches.server.ts), so one request reads each
 * switch once. Inside a transaction, pass the transaction handle so the read
 * sees the same snapshot as the writes.
 *
 * A missing table (0160 not applied yet), a missing row or a non-true value
 * means off, which is today's behaviour. Any other database error is thrown:
 * a failed read must not silently send a request down the old path once the
 * data has moved. (Before 0160, a read inside a transaction still aborts that
 * transaction, as any failed statement does; 0160 ships before any caller.)
 */
import { db, eq, platformSwitches } from "@workspace/db";
import { isPlatformSwitchKey, switchEnabled, type PlatformSwitchKey } from "./platform-switches.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

/** Postgres `undefined_table`. */
const UNDEFINED_TABLE = "42P01";

function pgErrorCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.cause?.code ?? e?.code;
}

export async function isSwitchOn(key: PlatformSwitchKey, q: Queryable = db): Promise<boolean> {
  if (!isPlatformSwitchKey(key)) return false;
  try {
    const [row] = await q
      .select({ enabled: platformSwitches.enabled })
      .from(platformSwitches)
      .where(eq(platformSwitches.key, key))
      .limit(1);
    return switchEnabled(row);
  } catch (error) {
    if (pgErrorCode(error) === UNDEFINED_TABLE) return false;
    throw error;
  }
}
