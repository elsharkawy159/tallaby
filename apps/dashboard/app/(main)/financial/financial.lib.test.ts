import { describe, expect, it } from "vitest";
import { buildSalesSources, normalizePaymentMethod, startOfMonth } from "./financial.lib";
import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";

const stores = [
  { id: "s1", name: "Nour Store" },
  { id: "s2", name: "Second Shop" },
];

describe("buildSalesSources", () => {
  it("splits earnings by channel and payment method, largest first", () => {
    const result = buildSalesSources(
      [
        { storeId: null, paymentMethod: "cash_on_delivery", earning: "100.10", orders: "2" },
        { storeId: "s1", paymentMethod: "cod", earning: "250.20", orders: 3 },
        { storeId: "s1", paymentMethod: "wallet_instapay", earning: 49.7, orders: 1 },
        { storeId: "s2", paymentMethod: "instapay", earning: "0", orders: "0" },
      ],
      stores
    );

    expect(result.total).toBe(400);
    expect(result.orders).toBe(6);
    expect(result.channels.map((c) => [c.key, c.name, c.amount, c.orders])).toEqual([
      ["s1", "Nour Store", 299.9, 4],
      ["marketplace", null, 100.1, 2],
    ]);
    expect(result.paymentMethods.map((m) => [m.key, m.amount])).toEqual([
      ["cod", 350.3],
      ["wallet", 49.7],
    ]);
    expect(result.channels.reduce((sum, c) => sum + c.share, 0)).toBeCloseTo(100);
  });

  it("keeps a store it can no longer name, and handles no sales", () => {
    const result = buildSalesSources(
      [{ storeId: "gone", paymentMethod: null, earning: "10", orders: "1" }],
      stores
    );
    expect(result.channels[0]).toMatchObject({ key: "gone", name: null, share: 100 });
    expect(result.paymentMethods[0]?.key).toBe("cod");

    expect(buildSalesSources([], stores)).toEqual({ total: 0, orders: 0, channels: [], paymentMethods: [] });
  });
});

describe("helpers", () => {
  it("normalizes payment methods", () => {
    expect(normalizePaymentMethod("cash")).toBe("cod");
    expect(normalizePaymentMethod("wallet")).toBe("wallet");
    expect(normalizePaymentMethod("wallet_vodafone_cash")).toBe("wallet");
    expect(normalizePaymentMethod("vodafone_cash")).toBe("vodafone_cash");
  });

  it("starts the month at midnight on the 1st", () => {
    expect(startOfMonth(new Date(2026, 2, 31, 15, 30))).toEqual(new Date(2026, 2, 1));
  });

  it("has every sales-source string in both locales", () => {
    const keys = (o: object): string[] =>
      Object.entries(o).flatMap(([k, v]) => (typeof v === "object" ? keys(v).map((s) => `${k}.${s}`) : [k]));
    expect(keys(ar.financial.sources).sort()).toEqual(keys(en.financial.sources).sort());
  });
});
