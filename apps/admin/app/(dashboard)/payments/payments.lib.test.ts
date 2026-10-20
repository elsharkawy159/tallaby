import { describe, expect, it } from "vitest";
import { paymentGroupOf, summarizePayments } from "./payments.lib";

describe("paymentGroupOf", () => {
  it("groups order payment statuses", () => {
    expect(paymentGroupOf("collected")).toBe("received");
    expect(paymentGroupOf("authorized")).toBe("pending");
    expect(paymentGroupOf("partially_refunded")).toBe("refunded");
    expect(paymentGroupOf("something_new")).toBeNull();
  });
});

describe("summarizePayments", () => {
  it("adds up statuses per method and overall, busiest method first", () => {
    const { totals, methods } = summarizePayments([
      { method: "instapay", paymentStatus: "paid", orders: 2, amount: 300 },
      { method: "cash_on_delivery", paymentStatus: "pending", orders: 5, amount: 1000 },
      { method: "instapay", paymentStatus: "failed", orders: 1, amount: 50 },
      { method: "cash_on_delivery", paymentStatus: "collected", orders: 1, amount: 200 },
    ]);
    expect(totals.received).toEqual({ orders: 3, amount: 500 });
    expect(totals.pending).toEqual({ orders: 5, amount: 1000 });
    expect(totals.failed).toEqual({ orders: 1, amount: 50 });
    expect(methods.map((m) => m.method)).toEqual(["cash_on_delivery", "instapay"]);
    expect(methods[1]).toMatchObject({ orders: 3, amount: 350 });
    expect(methods[1]!.groups.received.orders).toBe(2);
  });
});
