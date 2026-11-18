/**
 * Reads the Tallaby Pay settings (ROADMAP.md F-100a): fee bps, hold days and
 * minimum withdrawal from `billing_settings` (0175), and the `tallaby_pay_live`
 * launch switch. Server-only.
 *
 * Read fresh on every call, never stored in `@workspace/cache` (rule 8): an
 * Admin change or the switch must apply on the next request. In a React server
 * render, wrap it in the app's `cache()` so one request reads it once. Inside
 * a transaction, pass the transaction handle (order placement snapshots the fee
 * in the same snapshot as its writes).
 *
 * Before 0175 is applied the columns are missing: the defaults (and "off") are
 * returned. Note that a failed read inside a transaction still aborts that
 * transaction; 0175 ships before any caller.
 */
import { billingSettings, db, eq } from "@workspace/db";

import { isSwitchOn } from "../stores/platform-switches.server";
import { TALLABY_PAY_DEFAULT_SETTINGS, readTallabyPaySettings, type TallabyPaySettings } from "./settings.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

/** Postgres `undefined_column` / `undefined_table`. */
const MISSING = new Set(["42703", "42P01"]);

function pgErrorCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } };
  return e?.cause?.code ?? e?.code;
}

export async function getTallabyPaySettings(q: Queryable = db): Promise<TallabyPaySettings> {
  try {
    const [row] = await q
      .select({
        feeBps: billingSettings.tallabyPayFeeBps,
        holdDays: billingSettings.tallabyPayHoldDays,
        minPayout: billingSettings.tallabyPayMinPayout,
      })
      .from(billingSettings)
      .where(eq(billingSettings.id, true))
      .limit(1);
    const live = await isSwitchOn("tallaby_pay_live", q);
    return readTallabyPaySettings(row, live);
  } catch (error) {
    if (MISSING.has(pgErrorCode(error) ?? "")) return { ...TALLABY_PAY_DEFAULT_SETTINGS };
    throw error;
  }
}
