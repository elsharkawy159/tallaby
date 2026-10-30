import { describe, expect, it } from "vitest";
import {
  averageOrderPiastres,
  funnelSteps,
  governorateRows,
  outcomeRates,
  parseReportRange,
  pickReportStore,
  rate,
  reportPeriod,
  sourceRows,
  worstProducts,
  zonedMidnight,
  type ReportProduct,
} from "./reports.lib";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("parseReportRange", () => {
  it("accepts 7, 30 and 90 and defaults to 30", () => {
    expect(parseReportRange("7")).toBe(7);
    expect(parseReportRange(["90", "7"])).toBe(90);
    expect(parseReportRange("14")).toBe(30);
    expect(parseReportRange(undefined)).toBe(30);
  });
});

describe("pickReportStore", () => {
  it("keeps only the seller's own stores", () => {
    expect(pickReportStore(B, [A, B], A)).toBe(B);
    expect(pickReportStore("33333333-3333-4333-8333-333333333333", [A, B], B)).toBe(B);
    expect(pickReportStore("not-a-uuid", [A], null)).toBe(A);
    expect(pickReportStore(undefined, [], A)).toBeNull();
  });
});

describe("Cairo period", () => {
  it("starts at Cairo midnight in winter (UTC+2)", () => {
    expect(zonedMidnight("2026-01-15").toISOString()).toBe("2026-01-14T22:00:00.000Z");
  });

  it("starts at Cairo midnight in summer time (UTC+3)", () => {
    expect(zonedMidnight("2026-07-15").toISOString()).toBe("2026-07-14T21:00:00.000Z");
  });

  it("counts today as the last day, on the Cairo calendar", () => {
    // 23:30 UTC on Oct 29 is already Oct 30 in Cairo (UTC+3 until the end of October).
    const period = reportPeriod(7, new Date("2026-10-29T23:30:00Z"));
    expect(period.today).toBe("2026-10-30");
    expect(period.firstDay).toBe("2026-10-24");
    expect(period.start).toBe("2026-10-23T21:00:00.000Z");
  });

  it("is stable within one Cairo day (cache key)", () => {
    const a = reportPeriod(30, new Date("2026-03-10T08:00:00Z"));
    const b = reportPeriod(30, new Date("2026-03-10T20:00:00Z"));
    expect(a).toEqual(b);
    expect(a.firstDay).toBe("2026-02-09");
  });
});

describe("rates", () => {
  it("divides safely", () => {
    expect(rate(1, 4)).toBe(0.25);
    expect(rate(3, 0)).toBeNull();
    expect(rate(5, 4)).toBe(1);
  });

  it("splits refusal (of ended orders) from cancellation (of all orders)", () => {
    const r = outcomeRates({ orders: 10, delivered: 6, refused: 2, cancelled: 1 });
    expect(r.refusalRate).toBe(0.25);
    expect(r.deliveryRate).toBe(0.75);
    expect(r.cancelRate).toBe(0.1);
    expect(r.open).toBe(1);
  });

  it("has no rates before anything ended", () => {
    const r = outcomeRates({ orders: 0, delivered: 0, refused: 0, cancelled: 0 });
    expect(r).toEqual({ refusalRate: null, cancelRate: null, deliveryRate: null, open: 0 });
  });
});

describe("governorateRows", () => {
  it("merges spellings of one governorate and puts unknown last", () => {
    const rows = governorateRows(
      [
        { governorate: "Cairo", orders: 2, delivered: 1, refused: 1, cancelled: 0 },
        { governorate: "القاهرة", orders: 3, delivered: 2, refused: 0, cancelled: 1 },
        { governorate: null, orders: 9, delivered: 0, refused: 0, cancelled: 0 },
        { governorate: "Giza", orders: 1, delivered: 1, refused: 0, cancelled: 0 },
      ],
      "en",
      "Unknown",
    );
    expect(rows.map((r) => r.key)).toEqual(["CAIRO", "GIZA", "unknown"]);
    expect(rows[0]).toMatchObject({ orders: 5, delivered: 3, refused: 1, cancelled: 1 });
    expect(rows[0]!.refusalRate).toBe(0.25);
    expect(rows[2]!.label).toBe("Unknown");
  });
});

describe("sourceRows", () => {
  it("keeps a fixed order, adds shares of revenue and hides manual when empty", () => {
    const rows = sourceRows([
      { source: "marketplace", orders: "1", revenuePiastres: "2500" },
      { source: "store", orders: 3, revenuePiastres: "7500" },
      { source: "bogus", orders: 9, revenuePiastres: 999 },
    ]);
    expect(rows.map((r) => r.source)).toEqual(["store", "otherStores", "marketplace"]);
    expect(rows[0]).toMatchObject({ orders: 3, revenuePiastres: 7500, share: 0.75 });
    expect(rows[1]).toMatchObject({ orders: 0, share: 0 });
  });

  it("shows manual orders when there are some", () => {
    const rows = sourceRows([{ source: "manual", orders: 1, revenuePiastres: 100 }]);
    expect(rows.at(-1)).toMatchObject({ source: "manual", share: 1 });
  });

  it("has no shares without revenue", () => {
    expect(sourceRows([]).every((r) => r.share === null)).toBe(true);
  });
});

describe("funnelSteps", () => {
  it("runs views → checkouts → orders → delivered", () => {
    const steps = funnelSteps({ views: 200, abandonedCheckouts: 30, orders: 20, delivered: 10 });
    expect(steps.map((s) => [s.key, s.value])).toEqual([
      ["views", 200],
      ["checkouts", 50],
      ["orders", 20],
      ["delivered", 10],
    ]);
    expect(steps[1]!.fromPrevious).toBe(0.25);
    expect(steps[2]!.fromPrevious).toBe(0.4);
    expect(steps[3]!.fromTop).toBe(0.05);
  });

  it("starts at checkouts without GA4 and caps rates at 100%", () => {
    const steps = funnelSteps({ views: null, abandonedCheckouts: 0, orders: 4, delivered: 9 });
    expect(steps.map((s) => s.key)).toEqual(["checkouts", "orders", "delivered"]);
    expect(steps[2]!.value).toBe(4);
    const capped = funnelSteps({ views: 2, abandonedCheckouts: 5, orders: 5, delivered: 0 });
    expect(capped[1]!.fromPrevious).toBe(1);
  });
});

describe("products", () => {
  const p = (id: string): ReportProduct => ({ productId: id, title: id, image: null, units: 0, orders: 0, revenuePiastres: 0 });

  it("leaves best sellers out of the worst list", () => {
    expect(worstProducts([p("a"), p("b"), p("c")], [p("b")], 5).map((x) => x.productId)).toEqual(["a", "c"]);
    expect(worstProducts([p("a"), p("b"), p("c")], [], 2)).toHaveLength(2);
  });

  it("averages order value in whole piastres", () => {
    expect(averageOrderPiastres(10_001, 3)).toBe(3334);
    expect(averageOrderPiastres(500, 0)).toBeNull();
  });
});
