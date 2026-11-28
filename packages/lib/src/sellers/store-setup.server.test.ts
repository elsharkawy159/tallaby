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

describe("domain, SEO and wallet flags (owner, 2026-11-27)", () => {
  const text = new PgDialect().sqlToQuery(storeSetupFlagColumns(sql``)).sql;

  it("scope the domain to this store and seller, active only", () => {
    expect(text).toContain("cd.store_id = st.id AND cd.seller_id = s.id AND cd.status = 'active'");
  });

  it("count only the store's own SEO title or description, never the Search Console token", () => {
    expect(text).toContain("st.seo ->> 'titleTemplate'");
    expect(text).toContain("st.seo ->> 'description'");
    expect(text).not.toContain("googleSiteVerification'");
  });

  it("read the wallet like hasTopUp: a succeeded top-up or a top_up ledger entry of this seller", () => {
    expect(text).toContain("wtu.seller_id = s.id AND wtu.status = 'succeeded'");
    expect(text).toContain("wtx.seller_id = s.id AND wtx.type = 'top_up'");
  });

  it("map the new columns", () => {
    expect(toStoreSetupFlags({ setup_domain: true, setup_seo: true, setup_wallet: true })).toMatchObject({ domain: true, seo: true, wallet: true });
    expect(toStoreSetupFlags({})).toMatchObject({ domain: false, seo: false, wallet: false });
  });

  it("read a wallet above 0 from the ledger's balance, the mirror only without a wallet row (owner 2026-11-28)", () => {
    expect(text).toContain("(SELECT w.balance FROM seller_wallet w WHERE w.seller_id = s.id), s.wallet_balance, 0) > 0");
    expect(toStoreSetupFlags({ setup_wallet_funded: true }).walletFunded).toBe(true);
    expect(toStoreSetupFlags({}).walletFunded).toBe(false);
  });

  it("read the hand marks: store steps from the store's list, the wallet only from the account's", () => {
    expect(text).toContain("s.seller_metrics -> 'setupMarkedDone' -> (st.id::text)");
    expect(
      toStoreSetupFlags({ setup_marked_store: ["theme", "wallet", "nope"], setup_marked_account: ["wallet", "seo"] }).marked,
    ).toEqual(["theme", "wallet"]);
    expect(toStoreSetupFlags({ setup_marked_store: null, setup_marked_account: "x" }).marked).toEqual([]);
  });
});
