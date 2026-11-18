/**
 * Tallaby Pay settings, pure (ROADMAP.md F-100a). The values live in
 * `billing_settings` (0175) and the launch switch in `platform_switches`
 * (`tallaby_pay_live`); settings.server.ts reads them.
 */
import { TALLABY_PAY_MAX_FEE_BPS, amountToPiastres } from "./fee.lib";

export interface TallabyPaySettings {
  /** Fee in basis points, snapshotted on each order (300 = 3%). */
  feeBps: number;
  /** Days after delivery until the net is available (owner 2026-11-18: 0). */
  holdDays: number;
  /** Minimum withdrawal in piastres (owner 2026-11-18: EGP 500). */
  minPayoutPiastres: number;
  /** The launch switch: off until the owner turns it on. */
  live: boolean;
}

/** The 0175 column defaults; also used before 0175 is applied. */
export const TALLABY_PAY_DEFAULT_SETTINGS: Readonly<TallabyPaySettings> = Object.freeze({
  feeBps: 300,
  holdDays: 0,
  minPayoutPiastres: 50_000,
  live: false,
});

export interface TallabyPaySettingsRow {
  feeBps: number | null;
  holdDays: number | null;
  minPayout: string | null;
}

function safePiastres(amount: string | null): number | null {
  if (amount === null) return null;
  try {
    return amountToPiastres(amount);
  } catch {
    return null;
  }
}

/** A missing row or a value outside the database CHECKs falls back to the default for that field. */
export function readTallabyPaySettings(row: TallabyPaySettingsRow | undefined, live: boolean): TallabyPaySettings {
  const d = TALLABY_PAY_DEFAULT_SETTINGS;
  const feeBps = row?.feeBps;
  const holdDays = row?.holdDays;
  const min = safePiastres(row?.minPayout ?? null);
  return {
    feeBps: Number.isInteger(feeBps) && feeBps! >= 0 && feeBps! <= TALLABY_PAY_MAX_FEE_BPS ? feeBps! : d.feeBps,
    holdDays: Number.isInteger(holdDays) && holdDays! >= 0 && holdDays! <= 60 ? holdDays! : d.holdDays,
    minPayoutPiastres: min !== null && min >= 100 ? min : d.minPayoutPiastres,
    live,
  };
}
