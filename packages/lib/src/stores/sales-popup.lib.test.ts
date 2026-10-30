import { describe, expect, it } from "vitest";
import {
  buildSalesFeed,
  normalizeSalesPopupInput,
  parseStoreSalesPopup,
  SALES_FEED_LIMIT,
  SALES_POPUP_DEFAULTS,
  salesPopupAgo,
  salesPopupPageKind,
  salesPopupShowsOn,
  type SalesFeedRow,
} from "./sales-popup.lib";

const NOW = Date.parse("2026-10-30T12:00:00Z");
const ago = (minutes: number) => new Date(NOW - minutes * 60_000).toISOString();
const row = (minutes: number, product: string | null = "Linen shirt", state: string | null = "Giza"): SalesFeedRow => ({
  product,
  state,
  createdAt: ago(minutes),
});

describe("parseStoreSalesPopup", () => {
  it("is off with defaults when unset or malformed", () => {
    expect(parseStoreSalesPopup(null)).toEqual(SALES_POPUP_DEFAULTS);
    expect(parseStoreSalesPopup({ salesPopup: "x" })).toEqual(SALES_POPUP_DEFAULTS);
    expect(parseStoreSalesPopup({ salesPopup: [] })).toEqual(SALES_POPUP_DEFAULTS);
    expect(parseStoreSalesPopup({ salesPopup: { enabled: "true" } }).enabled).toBe(false);
  });

  it("keeps valid values and clamps the delay", () => {
    expect(parseStoreSalesPopup({ salesPopup: { enabled: true, delaySeconds: 20, pages: ["product", "home"] } })).toEqual({
      enabled: true,
      delaySeconds: 20,
      pages: ["home", "product"],
    });
    expect(parseStoreSalesPopup({ salesPopup: { delaySeconds: 1 } }).delaySeconds).toBe(3);
    expect(parseStoreSalesPopup({ salesPopup: { delaySeconds: 9999 } }).delaySeconds).toBe(120);
    expect(parseStoreSalesPopup({ salesPopup: { delaySeconds: "abc" } }).delaySeconds).toBe(8);
  });

  it("drops unknown pages and never leaves the list empty", () => {
    expect(normalizeSalesPopupInput({ enabled: true, pages: ["checkout", "cart"] }).pages).toEqual(["home", "catalog", "product", "other"]);
    expect(normalizeSalesPopupInput({ enabled: true, pages: ["other", "other", "checkout"] }).pages).toEqual(["other"]);
  });
});

describe("salesPopupPageKind", () => {
  it("maps store paths to page kinds", () => {
    expect(salesPopupPageKind("/")).toBe("home");
    expect(salesPopupPageKind("")).toBe("home");
    expect(salesPopupPageKind("/products")).toBe("catalog");
    expect(salesPopupPageKind("/products/")).toBe("catalog");
    expect(salesPopupPageKind("/products/linen-shirt")).toBe("product");
    expect(salesPopupPageKind("/pages/about")).toBe("other");
    expect(salesPopupPageKind("/blog/post")).toBe("other");
  });

  it("never shows on cart, checkout or account pages", () => {
    for (const path of ["/cart", "/checkout", "/checkout/success", "/orders/123", "/profile", "/auth/login", "/wishlist"]) {
      expect(salesPopupPageKind(path), path).toBeNull();
    }
  });

  it("respects the switch and the picked pages", () => {
    const on = { enabled: true, pages: ["product" as const] };
    expect(salesPopupShowsOn(on, "/products/x")).toBe(true);
    expect(salesPopupShowsOn(on, "/")).toBe(false);
    expect(salesPopupShowsOn({ ...on, enabled: false }, "/products/x")).toBe(false);
    expect(salesPopupShowsOn({ enabled: true, pages: ["home", "catalog", "product", "other"] }, "/cart")).toBe(false);
  });
});

describe("buildSalesFeed", () => {
  it("is empty with fewer than 3 recent orders", () => {
    expect(buildSalesFeed([row(5), row(10)], "en", NOW)).toEqual([]);
    // Old orders and rows without a product don't count.
    expect(buildSalesFeed([row(5), row(10), row(8 * 24 * 60)], "en", NOW)).toEqual([]);
    expect(buildSalesFeed([row(5), row(10), row(12, "  ")], "en", NOW)).toEqual([]);
  });

  it("returns only product, governorate and minutes ago", () => {
    const feed = buildSalesFeed([row(12), row(30, "Mug", "القاهرة"), row(90, "Lamp", null)], "ar", NOW);
    expect(feed).toEqual([
      { product: "Linen shirt", governorate: "الجيزة", minutesAgo: 12 },
      { product: "Mug", governorate: "القاهرة", minutesAgo: 30 },
      { product: "Lamp", governorate: null, minutesAgo: 90 },
    ]);
    for (const item of feed) expect(Object.keys(item).sort()).toEqual(["governorate", "minutesAgo", "product"]);
    expect(buildSalesFeed([row(1), row(2), row(3)], "en", NOW)[0]!.governorate).toBe("Giza");
  });

  it("drops unknown governorates, cuts long names and caps the list", () => {
    const long = "x".repeat(200);
    const feed = buildSalesFeed([row(1, long, "Atlantis"), row(2), row(3)], "en", NOW);
    expect(feed[0]!.governorate).toBeNull();
    expect(feed[0]!.product.length).toBe(80);
    const many = Array.from({ length: 30 }, (_, i) => row(i + 1));
    expect(buildSalesFeed(many, "en", NOW)).toHaveLength(SALES_FEED_LIMIT);
  });

  it("never gives a negative age (clock skew)", () => {
    expect(buildSalesFeed([row(-3), row(1), row(2)], "en", NOW)[0]!.minutesAgo).toBe(0);
  });
});

describe("salesPopupAgo", () => {
  it("picks minutes, hours or days", () => {
    expect(salesPopupAgo(0)).toEqual({ value: 0, unit: "minute" });
    expect(salesPopupAgo(59)).toEqual({ value: 59, unit: "minute" });
    expect(salesPopupAgo(125)).toEqual({ value: 2, unit: "hour" });
    expect(salesPopupAgo(3 * 24 * 60 + 5)).toEqual({ value: 3, unit: "day" });
  });
});
