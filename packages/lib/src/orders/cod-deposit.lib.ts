/**
 * Cash-on-delivery deposit (عربون), ROADMAP.md F-21 (owner approval 2026-11-12).
 * Pure; no DB imports.
 *
 * A store can ask every COD order for a deposit of 10, 20, 30 or 50 % of the
 * order total, rounded UP to the nearest 5 currency units (owner, 2026-10-29),
 * never more than the total. The customer pays it to the SELLER (their own
 * card gateway, or their own wallet / InstaPay with a screenshot); Tallaby
 * never holds it and the store wallet is never credited. The rest is cash on
 * delivery. Money in integer piastres (CLAUDE.md rule 7); the same numbers work
 * for a store in another currency (its "piastres" are its cents).
 *
 * The setting lives in `stores.settings.codDeposit = { percent }`, outside
 * `settings.payments`, so code that does not know it ignores it (the payments
 * schema is strict and would drop every method on an unknown key).
 */
import type { OrderGatewayMeta } from "../payments/store-gateways.lib";

export const DEPOSIT_PERCENTS = [10, 20, 30, 50] as const;
export type DepositPercent = (typeof DEPOSIT_PERCENTS)[number];

/** `orders.deposit_status` (0166). Awaiting → reported (customer says sent) → paid. */
export const DEPOSIT_STATUSES = ["awaiting", "reported", "paid"] as const;
export type DepositStatus = (typeof DEPOSIT_STATUSES)[number];

/** An unpaid deposit order is cancelled after this (owner, 2026-11-12). */
export const DEPOSIT_EXPIRY_HOURS = 48;

/** 5 currency units, in piastres. */
const ROUND_TO = 500;

export type CodDepositSetting = { percent: DepositPercent };

export function isDepositPercent(value: unknown): value is DepositPercent {
  return typeof value === "number" && (DEPOSIT_PERCENTS as readonly number[]).includes(value);
}

export function isDepositStatus(value: unknown): value is DepositStatus {
  return typeof value === "string" && (DEPOSIT_STATUSES as readonly string[]).includes(value);
}

/** Not paid yet: the order must not ship. */
export function isDepositPending(status: string | null | undefined): boolean {
  return status === "awaiting" || status === "reported";
}

/**
 * The deposit for a total: `percent` of it, rounded up to the nearest 5
 * (`ceil(piastres × percent / 100 / 500) × 500`, all in integers), capped at the total.
 */
export function computeDepositPiastres(totalPiastres: number, percent: DepositPercent): number {
  if (!Number.isFinite(totalPiastres) || totalPiastres <= 0) return 0;
  const total = Math.round(totalPiastres);
  const rounded = Math.ceil((total * percent) / (100 * ROUND_TO)) * ROUND_TO;
  return Math.min(total, rounded);
}

const toPiastres = (amount: string | number | null | undefined) => Math.round(Number(amount ?? 0) * 100);

/** The deposit and what is left to collect on delivery, from a total in currency units. */
export function splitDeposit(total: string | number, percent: DepositPercent): { depositPiastres: number; remainderPiastres: number } {
  const totalPiastres = Math.max(0, toPiastres(total));
  const depositPiastres = computeDepositPiastres(totalPiastres, percent);
  return { depositPiastres, remainderPiastres: totalPiastres - depositPiastres };
}

/** `stores.settings.codDeposit` when valid, else null (no deposit). */
export function parseCodDeposit(settings: unknown): CodDepositSetting | null {
  if (!settings || typeof settings !== "object") return null;
  const raw = (settings as Record<string, unknown>).codDeposit;
  if (!raw || typeof raw !== "object") return null;
  const percent = (raw as Record<string, unknown>).percent;
  return isDepositPercent(percent) ? { percent } : null;
}

/** A deposit can be paid only to the seller's own gateway or one of their transfer methods. */
export function depositPayable(checkout: { gateway?: OrderGatewayMeta | null; transfers?: Record<string, unknown> | null }): boolean {
  return Boolean(checkout.gateway) || Object.keys(checkout.transfers ?? {}).length > 0;
}

/** What storefront checkout asks for: the setting, only while COD is on and the deposit can be paid. */
export function codDepositFor(input: { codEnabled: boolean; setting: CodDepositSetting | null; payable: boolean }): CodDepositSetting | null {
  return input.codEnabled && input.setting && input.payable ? { percent: input.setting.percent } : null;
}

export type CodDepositChangeError = "invalid_percent" | "cod_off" | "no_payment_method";

/** Store settings › Payment methods › Deposit: null turns it off; a percent needs COD and a way to pay. */
export function validateCodDepositChange(
  percent: number | null,
  state: { codEnabled: boolean; payable: boolean },
): { success: true; data: CodDepositSetting | null } | { success: false; error: CodDepositChangeError } {
  if (percent === null) return { success: true, data: null };
  if (!isDepositPercent(percent)) return { success: false, error: "invalid_percent" };
  if (!state.codEnabled) return { success: false, error: "cod_off" };
  if (!state.payable) return { success: false, error: "no_payment_method" };
  return { success: true, data: { percent } };
}

type DepositColumns = {
  totalAmount: string | number | null;
  depositAmount: string | number | null;
  depositStatus: string | null;
};

/** Cash the courier collects for a COD order: the remainder once the deposit is paid, else the total. */
export function cashDuePiastres(order: DepositColumns): number {
  const total = Math.max(0, toPiastres(order.totalAmount));
  if (order.depositStatus !== "paid" || order.depositAmount == null) return total;
  return Math.max(0, total - toPiastres(order.depositAmount));
}

export type OrderDeposit = {
  percent: DepositPercent | null;
  status: DepositStatus;
  amountPiastres: number;
  remainderPiastres: number;
};

/** The order's deposit from its columns, or null when it has none. */
export function readOrderDeposit(order: DepositColumns & { depositPercent: number | null }): OrderDeposit | null {
  if (order.depositAmount == null || !isDepositStatus(order.depositStatus)) return null;
  const amountPiastres = Math.max(0, toPiastres(order.depositAmount));
  const total = Math.max(0, toPiastres(order.totalAmount));
  return {
    percent: isDepositPercent(order.depositPercent) ? order.depositPercent : null,
    status: order.depositStatus,
    amountPiastres,
    remainderPiastres: Math.max(0, total - amountPiastres),
  };
}

/** Orders created before this are past the 48 h window. */
export function depositCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - DEPOSIT_EXPIRY_HOURS * 60 * 60 * 1000);
}
