import { describe, expect, it } from "vitest";
import { aggregateCampaigns, deliveryRate, isKnownSource, touchOfRow, type CampaignRawRow } from "./campaigns.lib";

const row = (over: Partial<CampaignRawRow>): CampaignRawRow => ({
  source: null,
  medium: null,
  campaign: null,
  clickIds: null,
  referrerHost: null,
  orders: 1,
  delivered: 0,
  revenuePiastres: "0",
  ...over,
});

describe("touchOfRow", () => {
  it("reads click ids from jsonb arrays or strings", () => {
    expect(touchOfRow(row({ clickIds: ["fbclid", "bad"] })).clickIds).toEqual(["fbclid"]);
    expect(touchOfRow(row({ clickIds: '["ttclid"]' })).clickIds).toEqual(["ttclid"]);
    expect(touchOfRow(row({ clickIds: "{oops" })).clickIds).toEqual([]);
  });
});

describe("aggregateCampaigns", () => {
  it("groups by source and campaign with integer piastres", () => {
    const report = aggregateCampaigns([
      row({ source: "facebook", campaign: "Eid", orders: 3, delivered: 2, revenuePiastres: "150050" }),
      row({ source: "fb", campaign: "eid", orders: 1, delivered: 1, revenuePiastres: 20000 }),
      row({ source: "facebook", campaign: null, orders: 2, delivered: 0, revenuePiastres: "5000" }),
      row({ clickIds: ["ttclid"], orders: 1, delivered: 1, revenuePiastres: "999" }),
      row({ referrerHost: "l.instagram.com", orders: 1, revenuePiastres: "100" }),
      row({ orders: 10, delivered: 5, revenuePiastres: "1000000" }),
      row({ source: "x", orders: 0 }),
    ]);

    expect(report.totals).toEqual({ orders: 18, delivered: 9, revenuePiastres: 1176149 });
    expect(report.tracked).toEqual({ orders: 8, delivered: 4, revenuePiastres: 176149 });
    expect(report.sources.map((s) => s.source)).toEqual(["facebook", "tiktok", "instagram", "direct"]);

    const facebook = report.sources[0]!;
    expect(facebook).toMatchObject({ orders: 6, delivered: 3, revenuePiastres: 175050 });
    expect(facebook.campaigns).toEqual([
      { source: "facebook", campaign: "Eid", orders: 4, delivered: 3, revenuePiastres: 170050 },
      { source: "facebook", campaign: null, orders: 2, delivered: 0, revenuePiastres: 5000 },
    ]);
  });

  it("keeps direct last even when it is the biggest", () => {
    const report = aggregateCampaigns([row({ orders: 50 }), row({ source: "influencer_sara", orders: 1 })]);
    expect(report.sources.map((s) => s.source)).toEqual(["influencer_sara", "direct"]);
  });

  it("handles no rows", () => {
    expect(aggregateCampaigns([])).toEqual({
      totals: { orders: 0, delivered: 0, revenuePiastres: 0 },
      tracked: { orders: 0, delivered: 0, revenuePiastres: 0 },
      sources: [],
    });
  });
});

describe("helpers", () => {
  it("deliveryRate", () => {
    expect(deliveryRate(1, 4)).toBe(0.25);
    expect(deliveryRate(0, 0)).toBeNull();
  });
  it("isKnownSource", () => {
    expect(isKnownSource("tiktok")).toBe(true);
    expect(isKnownSource("sara")).toBe(false);
  });
});
