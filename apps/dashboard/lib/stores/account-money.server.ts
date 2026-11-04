import { cache } from "react";
import { and, db, eq, isNull, stores } from "@workspace/db";
import { accountMoneyOf, type AccountMoney } from "./account-money.lib";

/** The currency of a seller's account-level amounts, from their own stores. Display only. */
export const loadAccountMoney = cache(async (sellerId: string): Promise<AccountMoney> => {
  const rows = await db
    .select({ settings: stores.settings })
    .from(stores)
    .where(and(eq(stores.sellerId, sellerId), isNull(stores.deletedAt)));
  return accountMoneyOf(rows.map((row) => row.settings));
});
