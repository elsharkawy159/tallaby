import { describe, expect, it } from "vitest";
import {
  dayInZone,
  parseStoreViewsRange,
  parseStoreViewsReport,
  rangeDays,
  readGa4Env,
  serviceAccountJwtInput,
  storeViewsReportBody,
} from "./store-views.lib";

const STORE = "6f1c2a8e-1111-4222-8333-944455556666";

describe("parseStoreViewsRange", () => {
  it("accepts the offered ranges and falls back to 28", () => {
    expect(parseStoreViewsRange("7")).toBe(7);
    expect(parseStoreViewsRange(["90"])).toBe(90);
    expect(parseStoreViewsRange("30")).toBe(28);
    expect(parseStoreViewsRange(undefined)).toBe(28);
  });
});

describe("readGa4Env", () => {
  const key = "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----";

  it("reads the property and unescapes the key", () => {
    const env = readGa4Env({ GA4_PROPERTY_ID: "123456", GA4_SERVICE_ACCOUNT_EMAIL: "sa@x.iam.gserviceaccount.com", GA4_SERVICE_ACCOUNT_PRIVATE_KEY: key });
    expect(env?.propertyId).toBe("123456");
    expect(env?.privateKey).toContain("\nabc\n");
  });

  it("is null when anything is missing or malformed", () => {
    expect(readGa4Env({})).toBeNull();
    expect(readGa4Env({ GA4_PROPERTY_ID: "G-ABC", GA4_SERVICE_ACCOUNT_EMAIL: "a", GA4_SERVICE_ACCOUNT_PRIVATE_KEY: key })).toBeNull();
    expect(readGa4Env({ GA4_PROPERTY_ID: "1", GA4_SERVICE_ACCOUNT_EMAIL: "a", GA4_SERVICE_ACCOUNT_PRIVATE_KEY: "nope" })).toBeNull();
  });
});

describe("serviceAccountJwtInput", () => {
  it("encodes a read-only analytics claim for one hour", () => {
    const [header, claims] = serviceAccountJwtInput("sa@x", 1000).split(".");
    expect(JSON.parse(Buffer.from(header!, "base64url").toString())).toEqual({ alg: "RS256", typ: "JWT" });
    expect(JSON.parse(Buffer.from(claims!, "base64url").toString())).toMatchObject({
      iss: "sa@x",
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      iat: 1000,
      exp: 4600,
    });
  });
});

describe("storeViewsReportBody", () => {
  it("filters on exactly this store and asks for totals", () => {
    const body = storeViewsReportBody(STORE, 7);
    expect(body.dateRanges).toEqual([{ startDate: "6daysAgo", endDate: "today" }]);
    expect(body.dimensionFilter.filter).toEqual({
      fieldName: "customEvent:store_id",
      stringFilter: { matchType: "EXACT", value: STORE },
    });
    expect(body.metricAggregations).toEqual(["TOTAL"]);
  });
});

describe("rangeDays / dayInZone", () => {
  it("lists the range oldest first, across a month end", () => {
    expect(rangeDays("2026-11-02", 4)).toEqual(["2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02"]);
  });

  it("uses the property time zone", () => {
    expect(dayInZone(new Date("2026-10-27T22:30:00Z"), "Africa/Cairo")).toBe("2026-10-28");
  });
});

describe("parseStoreViewsReport", () => {
  const at = "2026-10-27T10:00:00.000Z";

  it("fills missing days with zeros and uses GA4 totals", () => {
    const report = parseStoreViewsReport(
      {
        rows: [
          { dimensionValues: [{ value: "20261025" }], metricValues: [{ value: "12" }, { value: "5" }] },
          { dimensionValues: [{ value: "20261027" }], metricValues: [{ value: "3" }, { value: "2" }] },
        ],
        totals: [{ dimensionValues: [{ value: "RESERVED_TOTAL" }], metricValues: [{ value: "15" }, { value: "6" }] }],
      },
      7,
      "2026-10-27",
      at,
    );
    expect(report.daily).toHaveLength(7);
    expect(report.daily.at(-3)).toEqual({ day: "2026-10-25", views: 12, visitors: 5 });
    expect(report.daily.at(-2)).toEqual({ day: "2026-10-26", views: 0, visitors: 0 });
    expect(report).toMatchObject({ views: 15, visitors: 6, range: 7, fetchedAt: at });
  });

  it("handles an empty report (no views yet)", () => {
    const report = parseStoreViewsReport({}, 28, "2026-10-27", at);
    expect(report.daily).toHaveLength(28);
    expect(report.views).toBe(0);
    expect(report.visitors).toBe(0);
  });
});
