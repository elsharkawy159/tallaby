import { describe, expect, it } from "vitest";
import { isNegativeAmount, parsePage, saleState } from "./earnings.lib";

const NOW = new Date("2026-11-18T12:00:00Z");
const base = { status: "pending" as const, refundState: null, orderStatus: "shipped", releaseAt: null };

describe("saleState", () => {
  it("waits for delivery while the order is on its way", () => {
    expect(saleState(base, NOW)).toBe("waiting_delivery");
  });

  it("shows a date while the release is in the future, and 'releasing' once it is due", () => {
    expect(saleState({ ...base, orderStatus: "delivered", releaseAt: "2026-11-20T00:00:00Z" }, NOW)).toBe("pending_until");
    expect(saleState({ ...base, orderStatus: "delivered", releaseAt: "2026-11-18T11:00:00Z" }, NOW)).toBe("releasing");
  });

  it("flags a returned or cancelled order that still holds pending money", () => {
    expect(saleState({ ...base, orderStatus: "returned" }, NOW)).toBe("returned");
    expect(saleState({ ...base, orderStatus: "cancelled" }, NOW)).toBe("returned");
  });

  it("puts a refund request and a refund before everything else", () => {
    expect(saleState({ ...base, refundState: "requested" }, NOW)).toBe("refund_requested");
    expect(saleState({ ...base, status: "refunded", refundState: "requested" }, NOW)).toBe("refunded");
    expect(saleState({ ...base, status: "available", orderStatus: "returned" }, NOW)).toBe("available");
  });
});

describe("parsePage", () => {
  it("accepts positive integers only", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage(["2"])).toBe(1);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("1.5")).toBe(1);
    expect(parsePage("abc")).toBe(1);
  });
});

describe("isNegativeAmount", () => {
  it("reads the sign of the 2 dp text", () => {
    expect(isNegativeAmount("-12.50")).toBe(true);
    expect(isNegativeAmount("-0.00")).toBe(false);
    expect(isNegativeAmount("0.00")).toBe(false);
    expect(isNegativeAmount("97.00")).toBe(false);
  });
});
