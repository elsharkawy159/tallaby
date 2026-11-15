import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { SELLER_AUDIENCES, SELLER_BROADCAST_MAX, isSellerAudience, sellerBroadcastSchema } from "./seller-broadcast.lib";
import { sellerAudienceCondition } from "./seller-broadcast.server";

const dialect = new PgDialect();
const text = (audience: (typeof SELLER_AUDIENCES)[number]) =>
  dialect.sqlToQuery(sellerAudienceCondition(audience)).sql.replace(/\s+/g, " ");

describe("sellerBroadcastSchema", () => {
  const ok = {
    audience: "wallet_empty",
    title: " يرجى شحن محفظة طلبي ",
    body: "Body",
    expectedCount: 3,
    idempotencyKey: "7f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b",
  };

  it("trims, makes an empty link null and keeps a dashboard path", () => {
    expect(sellerBroadcastSchema.parse(ok)).toMatchObject({ title: "يرجى شحن محفظة طلبي", link: null });
    expect(sellerBroadcastSchema.parse({ ...ok, link: "/wallet?topup=1" }).link).toBe("/wallet?topup=1");
    expect(sellerBroadcastSchema.parse({ ...ok, templateId: "top_up" }).templateId).toBe("top_up");
  });

  it("refuses an unknown audience, a zero or too large count, outside links and extra fields", () => {
    expect(sellerBroadcastSchema.safeParse({ ...ok, audience: "everyone" }).success).toBe(false);
    expect(sellerBroadcastSchema.safeParse({ ...ok, expectedCount: 0 }).success).toBe(false);
    expect(sellerBroadcastSchema.safeParse({ ...ok, expectedCount: SELLER_BROADCAST_MAX + 1 }).success).toBe(false);
    expect(sellerBroadcastSchema.safeParse({ ...ok, expectedCount: 1.5 }).success).toBe(false);
    expect(sellerBroadcastSchema.safeParse({ ...ok, link: "https://evil.com" }).success).toBe(false);
    expect(sellerBroadcastSchema.safeParse({ ...ok, link: "//evil.com" }).success).toBe(false);
    expect(sellerBroadcastSchema.safeParse({ ...ok, templateId: "x'; drop" }).success).toBe(false);
    expect(sellerBroadcastSchema.safeParse({ ...ok, sellerId: "x" }).success).toBe(false);
    expect(sellerBroadcastSchema.safeParse({ ...ok, body: "x".repeat(501) }).success).toBe(false);
  });

  it("knows its audiences", () => {
    expect(isSellerAudience("all")).toBe(true);
    expect(isSellerAudience("wallet_empty")).toBe(true);
    expect(isSellerAudience("x")).toBe(false);
    expect(isSellerAudience(undefined)).toBe(false);
  });
});

describe("sellerAudienceCondition", () => {
  it("leaves out suspended sellers and users in every audience", () => {
    for (const audience of SELLER_AUDIENCES) {
      expect(text(audience)).toContain("s.status IS DISTINCT FROM 'suspended'");
      expect(text(audience)).toContain("u.is_suspended IS TRUE");
    }
  });

  it("all: nothing but the base filter", () => {
    expect(text("all")).not.toContain("seller_wallet");
  });

  it("wallet_empty: the dashboard balance, a missing wallet counting as 0, at or below 0", () => {
    expect(text("wallet_empty")).toContain(
      "coalesce((SELECT w.balance FROM seller_wallet w WHERE w.seller_id = s.id), 0) <= 0",
    );
    expect(text("wallet_empty")).not.toContain("> 0)");
  });

  it("not_activated: getOrderLock's rule as one set query", () => {
    const where = text("not_activated");
    expect(where).toContain("b.usd_live IS TRUE");
    expect(where).toContain("s.plan = 'pro'");
    expect(where).toContain("t.status = 'succeeded'");
    expect(where).toContain("wt.type = 'top_up'");
    expect(where).toContain("seller_wallet w WHERE w.seller_id = s.id), 0) <= 0");
    expect(where).toContain("wt.currency = 'USD' AND wt.balance_after > 0");
  });

  it("binds no client values: audiences are fixed SQL", () => {
    for (const audience of SELLER_AUDIENCES) {
      expect(dialect.sqlToQuery(sellerAudienceCondition(audience)).params).toEqual([]);
    }
  });
});
