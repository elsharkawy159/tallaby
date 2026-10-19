import { describe, expect, it } from "vitest";
import { storeTopUpListSchema, storeWalletEntryListSchema, storeWalletListSchema } from "./wallet-view.lib";

const sellerId = "11111111-1111-4111-8111-111111111111";

describe("store-wallet admin filters", () => {
  it("accepts the filters the /wallets URL produces", () => {
    expect(
      storeWalletListSchema.safeParse({
        limit: 20,
        offset: 40,
        search: "tallaby",
        balance: ["negative"],
        status: ["active", "frozen"],
        mismatchOnly: true,
        sort: { id: "balance", desc: false },
      }).success,
    ).toBe(true);
    expect(
      storeWalletEntryListSchema.safeParse({
        sellerId,
        type: ["fee", "fee_reversal"],
        direction: "debit",
        from: "2026-10-01",
        to: "2026-10-18",
        sort: { id: "amount", desc: true },
      }).success,
    ).toBe(true);
    expect(storeTopUpListSchema.safeParse({ status: ["pending"], provider: ["instapay", "kashier"] }).success).toBe(true);
    expect(storeWalletListSchema.safeParse({}).success).toBe(true);
  });

  it("rejects unknown values, bad ids, bad dates, oversized pages and extra keys", () => {
    expect(storeWalletListSchema.safeParse({ balance: ["huge"] }).success).toBe(false);
    expect(storeWalletListSchema.safeParse({ sort: { id: "ledgerTotal; drop", desc: true } }).success).toBe(false);
    expect(storeWalletListSchema.safeParse({ limit: 1000 }).success).toBe(false);
    expect(storeWalletListSchema.safeParse({ sellerId }).success).toBe(false);
    expect(storeWalletEntryListSchema.safeParse({ sellerId: "not-a-uuid" }).success).toBe(false);
    expect(storeWalletEntryListSchema.safeParse({ type: ["bonus"] }).success).toBe(false);
    expect(storeWalletEntryListSchema.safeParse({ from: "18/10/2026" }).success).toBe(false);
    expect(storeTopUpListSchema.safeParse({ provider: ["paymob"] }).success).toBe(false);
  });
});
