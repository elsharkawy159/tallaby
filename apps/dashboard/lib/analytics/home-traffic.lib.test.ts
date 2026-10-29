import { describe, expect, it } from "vitest";
import { homeVisitsReportBody, parseHomeSources, parseHomeVisits, trafficPlatform } from "./home-traffic.lib";

const row = (dims: string[], value: string) => ({
  dimensionValues: dims.map((v) => ({ value: v })),
  metricValues: [{ value }],
});

describe("homeVisitsReportBody", () => {
  it("asks for the range and the period before it, filtered on the stores", () => {
    const body = homeVisitsReportBody(["a", "b"], 7);
    expect(body.dateRanges).toEqual([
      { startDate: "6daysAgo", endDate: "today", name: "current" },
      { startDate: "13daysAgo", endDate: "7daysAgo", name: "previous" },
    ]);
    expect(body.dimensionFilter.filter.inListFilter.values).toEqual(["a", "b"]);
  });
});

describe("parseHomeVisits", () => {
  it("zero-fills days and splits the two periods", () => {
    const json = {
      rows: [
        row(["20261028", "current"], "4"),
        row(["20261029", "current"], "6"),
        row(["20261020", "previous"], "3"),
        row(["20261021", "previous"], "2"),
      ],
    };
    expect(parseHomeVisits(json, 3, "2026-10-29")).toEqual({ visits: 10, previousVisits: 5, daily: [0, 4, 6] });
  });

  it("handles an empty response", () => {
    expect(parseHomeVisits({}, 2, "2026-10-29")).toEqual({ visits: 0, previousVisits: 0, daily: [0, 0] });
  });
});

describe("traffic sources", () => {
  it("maps referrer hosts to platforms", () => {
    expect(trafficPlatform("l.instagram.com")).toBe("instagram");
    expect(trafficPlatform("m.facebook.com")).toBe("facebook");
    expect(trafficPlatform("(direct)")).toBe("direct");
    expect(trafficPlatform("google")).toBe("google");
    expect(trafficPlatform("example.com")).toBeNull();
  });

  it("groups, sorts and caps the list", () => {
    const json = {
      rows: [
        row(["instagram.com"], "5"),
        row(["l.instagram.com"], "4"),
        row(["(direct)"], "7"),
        row(["example.com"], "2"),
        row(["(not set)"], "9"),
      ],
    };
    expect(parseHomeSources(json, 2)).toEqual([
      { platform: "instagram", label: "instagram", sessions: 9 },
      { platform: "direct", label: "direct", sessions: 7 },
    ]);
  });
});
