/**
 * Admin › Billing (ROADMAP.md F-55f, F-56): the settings form's validation and
 * the checks the page shows. Pure.
 */
import { z } from "zod";
import { isPlausibleRate } from "../billing/billing.lib";

/** The margin the database accepts (0136: margin_bps BETWEEN 0 AND 2000). */
export const BILLING_MARGIN_MAX_PERCENT = 20;
/** A fetched rate older than this gets a warning: the daily job has probably failed. */
export const RATE_STALE_HOURS = 48;

export const billingSettingsSchema = z.strictObject({
  marginPercent: z.number().min(0).max(BILLING_MARGIN_MAX_PERCENT),
  /** EGP per USD; null = use the daily rate. */
  rateOverride: z.number().refine(isPlausibleRate, "Enter a rate between 10 and 500").nullable(),
  taxEnabled: z.boolean(),
});

export type BillingSettingsInput = z.input<typeof billingSettingsSchema>;

/** 2.5% as 250 basis points, with no float residue. */
export function percentToBps(percent: number): number {
  return Math.round(percent * 100);
}

/** Whole hours since the rate was fetched; null if none was ever fetched. */
export function rateAgeHours(fetchedAt: string | null, now: Date = new Date()): number | null {
  if (!fetchedAt) return null;
  return Math.floor((now.getTime() - new Date(fetchedAt).getTime()) / 3_600_000);
}

/** True when there is no fetched rate, or the last one is too old to trust. */
export function isRateStale(fetchedAt: string | null, now: Date = new Date()): boolean {
  const age = rateAgeHours(fetchedAt, now);
  return age === null || age >= RATE_STALE_HOURS;
}
