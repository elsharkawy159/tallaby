import { describe, expect, it } from "vitest";
import { lineOfferDiscountLines, pickBestLineOffers, type LineOffer } from "./line-discounts.lib";

const tier = (discountPiastres: number): LineOffer => ({ kind: "quantity_offer", discountPiastres, metadata: { quantityOffer: {} } });
const cross = (discountPiastres: number): LineOffer => ({ kind: "cross_sell", discountPiastres, metadata: { crossSell: {} } });

describe("pickBestLineOffers", () => {
  it("takes the bigger offer and never adds them", () => {
    const [line] = pickBestLineOffers([[tier(100), cross(300)]], [1000]);
    expect(line).toMatchObject({ kind: "cross_sell", discountPiastres: 300 });
  });
  it("gives a tie to the earlier one", () => {
    expect(pickBestLineOffers([[tier(100), cross(100)]], [1000])[0]?.kind).toBe("quantity_offer");
  });
  it("leaves a line with no offer alone", () => {
    expect(pickBestLineOffers([[null, null], []], [1000, 1000])).toEqual([null, null]);
    expect(pickBestLineOffers([[tier(0)]], [1000])).toEqual([null]);
  });
  it("never takes a line below zero", () => {
    expect(pickBestLineOffers([[tier(5000)]], [1000])[0]?.discountPiastres).toBe(1000);
  });
});

describe("lineOfferDiscountLines", () => {
  it("adds up per kind", () => {
    expect(lineOfferDiscountLines([tier(100), tier(250), cross(50), null])).toEqual([
      { type: "quantity_offer", label: "Quantity offer", amount: "3.50" },
      { type: "cross_sell", label: "Bundle offer", amount: "0.50" },
    ]);
  });
  it("is empty with no offers", () => {
    expect(lineOfferDiscountLines([null])).toEqual([]);
  });
});
