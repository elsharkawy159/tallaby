import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import {
  SELLER_AUDIENCES,
  SELLER_BROADCAST_MAX,
  isSellerAudience,
  sellerAudienceSchema,
  sellerBroadcastSchema,
} from "./seller-broadcast.lib";
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
    for (const audience of [
      "tallaby_pay_not_connected",
      "no_active_product",
      "site_not_published",
      "no_shipping_zones",
      "free_plan",
      "pro_plan",
      "joined_last_7_days",
    ]) {
      expect(isSellerAudience(audience)).toBe(true);
      expect(sellerAudienceSchema.safeParse(audience).success).toBe(true);
    }
    expect(new Set(SELLER_AUDIENCES).size).toBe(SELLER_AUDIENCES.length);
  });

  it("refuses unknown or mis-cased audiences", () => {
    for (const value of ["", "ALL", "Free_plan", "pro", "tallaby_pay", "no_shipping_zones ", 1, null, {}]) {
      expect(sellerAudienceSchema.safeParse(value).success).toBe(false);
      expect(isSellerAudience(value)).toBe(false);
    }
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

  const LIVE_STORE = "st.seller_id = s.id AND st.deleted_at IS NULL AND st.status <> 'archived'";
  const STORE_AUDIENCES = ["tallaby_pay_not_connected", "no_active_product", "site_not_published", "no_shipping_zones"] as const;

  it("store audiences: need a live store and look only at live stores", () => {
    for (const audience of STORE_AUDIENCES) {
      const where = text(audience);
      expect(where).toContain(`AND EXISTS (SELECT 1 FROM stores st WHERE ${LIVE_STORE})`);
      expect(where).toContain(`AND NOT EXISTS (SELECT 1 FROM stores st`);
      // Both the "has a store" and the "none of them" parts use the live-store rule.
      expect(where.split(LIVE_STORE).length - 1).toBe(2);
    }
  });

  it("tallaby_pay_not_connected: no connected Tallaby Pay row of the seller's own store", () => {
    const where = text("tallaby_pay_not_connected");
    expect(where).toContain("JOIN store_integrations si ON si.store_id = st.id AND si.seller_id = s.id");
    expect(where).toContain("si.provider = 'tallaby_pay' AND si.status = 'connected'");
  });

  it("no_active_product: storeHasActiveProduct's rule (active, not in Trash, the seller's own)", () => {
    const where = text("no_active_product");
    expect(where).toContain("JOIN products p ON p.store_id = st.id AND p.seller_id = s.id");
    expect(where).toContain("p.status = 'active' AND p.deleted_at IS NULL");
  });

  it("site_not_published and no_shipping_zones", () => {
    expect(text("site_not_published")).toContain("st.site_status = 'published'");
    expect(text("no_shipping_zones")).toContain("JOIN store_shipping_zones z ON z.store_id = st.id");
    expect(text("no_shipping_zones")).toContain("z.enabled IS TRUE");
  });

  it("free_plan and pro_plan: isProActive's rule, one the negation of the other", () => {
    const pro = "(s.plan = 'pro' AND (greatest(s.plan_expires_at, s.plan_grace_until) IS NULL OR greatest(s.plan_expires_at, s.plan_grace_until) > now()))";
    expect(text("pro_plan")).toContain(`AND ${pro}`);
    expect(text("free_plan")).toContain(`AND NOT ${pro}`);
    expect(text("not_activated")).toContain(`AND NOT ${pro}`);
  });

  it("joined_last_7_days: created in the last 7 days", () => {
    expect(text("joined_last_7_days")).toContain("s.created_at >= now() - interval '7 days'");
  });

  it("binds no client values: audiences are fixed SQL", () => {
    for (const audience of SELLER_AUDIENCES) {
      expect(dialect.sqlToQuery(sellerAudienceCondition(audience)).params).toEqual([]);
    }
  });
});
