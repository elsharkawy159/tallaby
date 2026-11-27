import { describe, expect, it } from "vitest";
import { downsellSaveSchema, isCheaperPrice, pickDownsellLine } from "./downsell.lib";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("downsell", () => {
  it("accepts one product or one coupon offer, and nothing else", () => {
    expect(downsellSaveSchema.safeParse({ productId: A, offer: { kind: "product", productId: B } }).success).toBe(true);
    expect(downsellSaveSchema.safeParse({ productId: A, offer: { kind: "coupon", couponId: B } }).success).toBe(true);
    expect(downsellSaveSchema.safeParse({ productId: A, offer: { kind: "coupon", couponId: "x" } }).success).toBe(false);
    expect(downsellSaveSchema.safeParse({ productId: A, offer: { kind: "product", productId: B, price: 1 } }).success).toBe(false);
    expect(downsellSaveSchema.safeParse({ productId: A, sellerId: B, offer: { kind: "product", productId: B } }).success).toBe(false);
  });

  it("counts a product as cheaper only when it is strictly below", () => {
    expect(isCheaperPrice(900, 1000)).toBe(true);
    expect(isCheaperPrice(1000, 1000)).toBe(false);
    expect(isCheaperPrice(0, 1000)).toBe(false);
    expect(isCheaperPrice(Number.NaN, 1000)).toBe(false);
  });

  it("picks the first cart line with an offer, skipping a product offer that is no longer cheaper", () => {
    const lines = [
      { lineId: "l1", productId: "p1", unitMinor: 500 },
      { lineId: "l2", productId: "p2", unitMinor: 2000 },
      { lineId: "l3", productId: "p3", unitMinor: 2000 },
    ];
    const offers = new Map<string, { kind: "product"; unitMinor: number } | { kind: "coupon" }>([
      ["p1", { kind: "product", unitMinor: 600 }],
      ["p3", { kind: "coupon" }],
    ]);
    expect(pickDownsellLine(lines, offers)?.line.lineId).toBe("l3");
    offers.set("p2", { kind: "product", unitMinor: 1500 });
    expect(pickDownsellLine(lines, offers)?.line.lineId).toBe("l2");
    expect(pickDownsellLine([], offers)).toBeNull();
  });
});
