import { describe, expect, it } from "vitest";
import {
  AD_STATUS_TRANSITIONS,
  canMoveAdRequest,
  domainAdminActionSchema,
  likePattern,
  pageCount,
  parseAdminListParams,
  pickEnum,
  publicIntegrationConfig,
  sellerCouponToggleSchema,
  templateUpdateSchema,
} from "./saas.lib";

const ID = "00000000-0000-4000-8000-000000000001";

describe("list params", () => {
  it("defaults and clamps page and search", () => {
    expect(parseAdminListParams({})).toEqual({ q: null, page: 1 });
    expect(parseAdminListParams({ q: "  shop ", page: "4" })).toEqual({ q: "shop", page: 4 });
    expect(parseAdminListParams({ page: "-1" }).page).toBe(1);
    expect(parseAdminListParams({ page: "99999" }).page).toBe(1000);
  });

  it("only accepts allow-listed enum values", () => {
    expect(pickEnum("active", ["active", "failed"] as const)).toBe("active");
    expect(pickEnum("'; drop", ["active"] as const)).toBeNull();
    expect(pickEnum(["failed", "active"], ["active", "failed"] as const)).toBe("failed");
  });

  it("escapes LIKE wildcards", () => {
    expect(likePattern("50%_off\\")).toBe("%50\\%\\_off\\\\%");
  });

  it("counts pages", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(26, 25)).toBe(2);
  });
});

describe("publicIntegrationConfig", () => {
  it("keeps public ids and counters, drops everything else", () => {
    expect(
      publicIntegrationConfig({
        pixelId: "123",
        accessToken: "secret",
        refreshToken: "secret",
        spreadsheetId: "private-sheet",
        exportedOrders: 12,
      }),
    ).toEqual({ pixelId: "123", exportedOrders: "12" });
    expect(publicIntegrationConfig(null)).toEqual({});
  });
});

describe("ad status flow", () => {
  it("allows only forward moves, rejection before going live", () => {
    expect(canMoveAdRequest("pending", "approved")).toBe(true);
    expect(canMoveAdRequest("pending", "rejected")).toBe(true);
    expect(canMoveAdRequest("approved", "active")).toBe(true);
    expect(canMoveAdRequest("active", "rejected")).toBe(false);
    expect(canMoveAdRequest("completed", "pending")).toBe(false);
    expect(AD_STATUS_TRANSITIONS.rejected).toEqual([]);
  });
});

describe("schemas", () => {
  it("seller coupon toggle needs a reason", () => {
    expect(sellerCouponToggleSchema.safeParse({ couponId: ID, active: false, reason: "ok" }).success).toBe(false);
    expect(sellerCouponToggleSchema.safeParse({ couponId: ID, active: false, reason: "abuse" }).success).toBe(true);
  });

  it("domain remove needs a reason, re-check does not", () => {
    expect(domainAdminActionSchema.safeParse({ action: "recheck", domainId: ID }).success).toBe(true);
    expect(domainAdminActionSchema.safeParse({ action: "remove_domain", domainId: ID }).success).toBe(false);
    expect(domainAdminActionSchema.safeParse({ action: "remove_domain", domainId: ID, reason: "phishing" }).success).toBe(true);
  });

  it("template price is normalised and required for premium", () => {
    const base = { templateId: ID, isActive: true, sortOrder: 1, reason: "pricing" };
    const parsed = templateUpdateSchema.safeParse({ ...base, isPremium: true, price: "99.5" });
    expect(parsed.success && parsed.data.price).toBe("99.50");
    expect(templateUpdateSchema.safeParse({ ...base, isPremium: true, price: null }).success).toBe(false);
    expect(templateUpdateSchema.safeParse({ ...base, isPremium: false, price: "-1" }).success).toBe(false);
  });
});
