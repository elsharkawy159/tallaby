import { cache } from "react";
import { and, db, eq, isNull, stores } from "@workspace/db";
import { parseStoreCurrency } from "@workspace/lib";
import type { MoneyUnit } from "@/lib/i18n/format";
import { accountMoneyOf, type AccountMoney } from "./account-money.lib";

/** Store id → its currency, for lists whose rows don't carry one. Only this seller's stores. */
export const loadStoreMoney = cache(async (sellerId: string): Promise<Record<string, MoneyUnit>> => {
  const rows = await db
    .select({ id: stores.id, settings: stores.settings })
    .from(stores)
    .where(and(eq(stores.sellerId, sellerId), isNull(stores.deletedAt)));
  return Object.fromEntries(rows.map((row) => [row.id, parseStoreCurrency(row.settings)]));
});

/** The currency of a seller's account-level amounts, from their own stores. Display only. */
export const loadAccountMoney = cache(async (sellerId: string): Promise<AccountMoney> => {
  const rows = await db
    .select({ settings: stores.settings })
    .from(stores)
    .where(and(eq(stores.sellerId, sellerId), isNull(stores.deletedAt)));
  return accountMoneyOf(rows.map((row) => row.settings));
});
