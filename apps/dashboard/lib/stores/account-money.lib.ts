import { DEFAULT_CURRENCY, parseStoreCurrency } from "@workspace/lib";
import { MIXED_CURRENCIES, type MoneyUnit } from "@/lib/i18n/format";

/**
 * What an account-level amount (a product price, a coupon) is in. Products and
 * coupons belong to the seller, not to one store, and a store shows the same
 * number whatever its currency. So all of a seller's stores in one currency show
 * it; mixed stores show no currency at all (`mixed`), never a wrong one.
 */
export type AccountMoney = { unit: MoneyUnit; mixed: boolean };

export const EGP_ACCOUNT: AccountMoney = { unit: { currency: DEFAULT_CURRENCY }, mixed: false };

/** `settings` of each of the seller's stores. No stores yet means EGP. */
export function accountMoneyOf(storeSettings: readonly unknown[]): AccountMoney {
  const stores = storeSettings.map((settings) => parseStoreCurrency(settings));
  const first = stores[0];
  if (!first) return EGP_ACCOUNT;
  if (stores.some((s) => s.currency !== first.currency)) return { unit: { currency: MIXED_CURRENCIES }, mixed: true };
  // The same currency with different symbols: its default symbol, not one store's.
  const sameLabel = stores.every((s) => s.label === first.label);
  return { unit: { currency: first.currency, ...(sameLabel && { label: first.label }) }, mixed: false };
}
