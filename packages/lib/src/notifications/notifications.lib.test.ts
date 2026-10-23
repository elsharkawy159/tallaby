import { describe, expect, it } from "vitest";
import {
  MAX_NOTIFICATION_IDS,
  adminNotificationHref,
  clampNotificationLimit,
  notificationText,
  parseNotificationIds,
  sellerNotificationHref,
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
    expect(adminNotificationHref({ type: "unknown", sellerId: null, storeId: null })).toBeNull();
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
    expect(sellerNotificationHref({ type: "nope", data: {} })).toBeNull();
  });
});

describe("notificationText", () => {
  it("returns strings only", () => {
    expect(notificationText({ a: "x", b: 3 }, "a")).toBe("x");
    expect(notificationText({ a: "x", b: 3 }, "b")).toBe("");
  });
});
