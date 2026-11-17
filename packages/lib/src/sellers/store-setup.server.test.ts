import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { parseStorePayments, storefrontCheckoutMethods } from "../payments/store-methods";
import { storeSetupFlagColumns, toStoreSetupFlags } from "./store-setup.server";

/**
 * The payments step counts as set up for every store (owner, 2026-11-17),
 * because checkout offers cash on delivery when the seller never saved
 * payment settings. If that default ever changes, the flag must change too.
 */
describe("payments are set up by default", () => {
  it("checkout offers cash on delivery with no saved payment settings, in any store currency", () => {
    for (const raw of [undefined, null, {}, "broken"]) {
      const payments = parseStorePayments(raw);
      expect(storefrontCheckoutMethods(payments, null, "EGP").methods).toContain("cash_on_delivery");
      expect(storefrontCheckoutMethods(payments, null, "SAR").methods).toContain("cash_on_delivery");
    }
  });

  it("saved settings always keep at least one method on", () => {
    // Switching the only method off is refused (last_method), so it parses back to the defaults.
    expect(storefrontCheckoutMethods(parseStorePayments({ cod: { enabled: false, fee: 0 } })).methods).toEqual(["cash_on_delivery"]);
  });

  it("the flag is the store itself: no saved settings or gateway needed, and false without a store", () => {
    const text = new PgDialect().sqlToQuery(storeSetupFlagColumns(sql``)).sql;
    expect(text).toContain("(st.id IS NOT NULL) AS setup_payments");
    expect(text).not.toContain("st.settings ? 'payments'");
    expect(toStoreSetupFlags({ setup_payments: true }).payments).toBe(true);
    expect(toStoreSetupFlags({ setup_payments: false }).payments).toBe(false);
  });
});
