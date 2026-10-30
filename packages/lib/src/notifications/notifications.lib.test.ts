import { describe, expect, it } from "vitest";
import {
  MAX_NOTIFICATION_IDS,
  adminNotificationHref,
  clampNotificationLimit,
  isDashboardPath,
  notificationCount,
  notificationText,
  parseNotificationIds,
  sellerNotificationHref,
  sellerNotificationValues,
} from "./notifications.lib";

const ID = "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b";

describe("parseNotificationIds", () => {
  it("accepts and de-duplicates UUIDs", () => {
    expect(parseNotificationIds([ID, ID.toUpperCase()])).toEqual([ID]);
  });

  it("rejects anything that is not a non-empty array of UUIDs", () => {
    expect(parseNotificationIds(undefined)).toBeNull();
    expect(parseNotificationIds([])).toBeNull();
    expect(parseNotificationIds(ID)).toBeNull();
    expect(parseNotificationIds([ID, "1 OR 1=1"])).toBeNull();
    expect(parseNotificationIds(Array(MAX_NOTIFICATION_IDS + 1).fill(ID))).toBeNull();
  });
});

describe("clampNotificationLimit", () => {
  it("defaults and clamps", () => {
    expect(clampNotificationLimit(undefined)).toBe(20);
    expect(clampNotificationLimit(0)).toBe(1);
    expect(clampNotificationLimit(500)).toBe(50);
    expect(clampNotificationLimit(Number.NaN)).toBe(20);
  });
});

describe("adminNotificationHref", () => {
  it("links each type to its admin page", () => {
    expect(adminNotificationHref({ type: "seller_created", sellerId: ID, storeId: null })).toBe(`/sellers/${ID}`);
    expect(adminNotificationHref({ type: "store_published", sellerId: ID, storeId: ID })).toBe(`/stores/${ID}`);
    expect(adminNotificationHref({ type: "store_created", sellerId: ID, storeId: null })).toBe("/stores");
    expect(adminNotificationHref({ type: "top_up_requested", sellerId: ID, storeId: null })).toBe("/store-top-ups");
    expect(adminNotificationHref({ type: "feature_request_created", sellerId: ID, storeId: null })).toBe("/roadmap");
    expect(adminNotificationHref({ type: "referral_payout_requested", sellerId: ID, storeId: null })).toBe("/referrals");
    expect(adminNotificationHref({ type: "unknown", sellerId: null, storeId: null })).toBeNull();
  });

  it("links the seller-action types (0116)", () => {
    const one = { type: "product_created", sellerId: ID, storeId: null, data: { productId: ID, count: 1 } };
    expect(adminNotificationHref(one)).toBe(`/products/${ID}`);
    expect(adminNotificationHref({ ...one, data: { productId: ID, count: 7 } })).toBe(`/products?seller=${ID}`);
    expect(adminNotificationHref({ ...one, sellerId: null, data: {} })).toBe("/products");
    expect(
      adminNotificationHref({ type: "first_order_received", sellerId: ID, storeId: ID, data: { orderId: ID } })
    ).toBe(`/orders/${ID}`);
    expect(adminNotificationHref({ type: "first_order_received", sellerId: ID, storeId: ID })).toBe("/orders");
    expect(adminNotificationHref({ type: "integration_connected", sellerId: ID, storeId: ID })).toBe("/integrations");
    expect(adminNotificationHref({ type: "store_unpublished", sellerId: ID, storeId: ID })).toBe(`/stores/${ID}`);
    expect(adminNotificationHref({ type: "store_deleted", sellerId: ID, storeId: ID })).toBe(`/sellers/${ID}`);
  });
});

describe("notificationCount", () => {
  it("reads a positive integer count, else 1", () => {
    expect(notificationCount({ count: 12 })).toBe(12);
    expect(notificationCount({})).toBe(1);
    expect(notificationCount({ count: "3" })).toBe(1);
    expect(notificationCount({ count: 0 })).toBe(1);
  });
});

describe("sellerNotificationHref", () => {
  it("opens the order, or the list when the id is missing", () => {
    expect(sellerNotificationHref({ type: "order_created", data: { orderId: ID } })).toBe(`/orders?order=${ID}`);
    expect(sellerNotificationHref({ type: "order_created", data: {} })).toBe("/orders");
  });

  it("encodes data it puts in the URL", () => {
    expect(sellerNotificationHref({ type: "order_created", data: { orderId: "a&b" } })).toBe("/orders?order=a%26b");
  });

  it("links the other types", () => {
    expect(sellerNotificationHref({ type: "top_up_rejected", data: {} })).toBe("/wallet");
    expect(sellerNotificationHref({ type: "review_received", data: {} })).toBe("/reviews");
    expect(sellerNotificationHref({ type: "referral_commission_earned", data: {} })).toBe("/earn");
    expect(sellerNotificationHref({ type: "referral_payout_paid", data: {} })).toBe("/earn");
    expect(sellerNotificationHref({ type: "referral_payout_rejected", data: {} })).toBe("/earn");
    expect(sellerNotificationHref({ type: "nope", data: {} })).toBeNull();
  });

  it("opens a low-stock alert on the product's inventory history", () => {
    expect(sellerNotificationHref({ type: "low_stock", data: { productId: ID } })).toBe(`/products/inventory?product=${ID}`);
    expect(sellerNotificationHref({ type: "low_stock", data: {} })).toBe("/products/inventory");
  });
});

describe("notificationText", () => {
  it("returns strings only", () => {
    expect(notificationText({ a: "x", b: 3 }, "a")).toBe("x");
    expect(notificationText({ a: "x", b: 3 }, "b")).toBe("");
  });
});

describe("admin messages (0131)", () => {
  it("isDashboardPath accepts in-app paths only", () => {
    expect(isDashboardPath("/wallet")).toBe(true);
    expect(isDashboardPath("/orders?order=1")).toBe(true);
    expect(isDashboardPath("//evil.com")).toBe(false);
    expect(isDashboardPath("/\\evil.com")).toBe(false);
    expect(isDashboardPath("https://evil.com")).toBe(false);
    expect(isDashboardPath("javascript:alert(1)")).toBe(false);
    expect(isDashboardPath("/a b")).toBe(false);
    expect(isDashboardPath(`/${"a".repeat(300)}`)).toBe(false);
  });

  it("links an admin message only to a safe dashboard path", () => {
    expect(sellerNotificationHref({ type: "admin_message", data: { link: "/wallet" } })).toBe("/wallet");
    expect(sellerNotificationHref({ type: "admin_message", data: { link: "//evil.com" } })).toBeNull();
    expect(sellerNotificationHref({ type: "admin_message", data: {} })).toBeNull();
  });

  it("sellerNotificationValues formats what the bell shows", () => {
    const values = sellerNotificationValues({ amount: "100.00", orderNumber: "7", name: "Mug", variantTitle: "Red", stock: 2 }, (a) => `EGP ${a}`);
    expect(values).toMatchObject({ amount: "EGP 100.00", orderNumber: "7", name: "Mug · Red", stock: 2, count: 1, rating: 0 });
    expect(sellerNotificationValues({}, () => "x").amount).toBe("");
  });
});
