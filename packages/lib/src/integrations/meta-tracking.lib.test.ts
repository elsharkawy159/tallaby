import { describe, expect, it } from "vitest";
import {
  browserBlockedMetaEvents,
  buildDeferredPurchase,
  buildDeliveredClaimPatch,
  buildDeliveredPurchaseEvent,
  DEFAULT_META_TRACKING,
  deliveredPurchaseDecision,
  effectivePurchaseTiming,
  META_DEFERRED_PURCHASE_KEY,
  META_DELIVERED_FAILURES_KEY,
  META_DELIVERED_SENT_KEY,
  orderTimePurchaseDecision,
  readDeferredPurchase,
  readMetaTrackingSettings,
  sanitizeMetaUserData,
  validateMetaTrackingInput,
  type MetaTrackingSettings,
} from "./meta-tracking.lib";
import { readPublicDetails } from "./validate";

const delivered: MetaTrackingSettings = { ...DEFAULT_META_TRACKING, purchaseOn: "delivered" };
const NOW = new Date("2026-10-30T12:00:00.000Z");
const deferred = buildDeferredPurchase(
  { em: ["a".repeat(64)], client_ip_address: "1.2.3.4", fbp: "fb.1.1.1", secret: "x" },
  "https://shop.example.com/checkout",
  new Date("2026-10-25T10:00:00.000Z"),
);

describe("Meta tracking settings (F-30)", () => {
  it("defaults keep today's behaviour: commerce events on, Lead off, Purchase at order", () => {
    for (const config of [undefined, null, {}, { pixelId: "123456789012345" }, { tracking: "junk" }]) {
      expect(readMetaTrackingSettings(config)).toEqual(DEFAULT_META_TRACKING);
    }
    expect(DEFAULT_META_TRACKING.events).toEqual({
      ViewContent: true,
      AddToCart: true,
      InitiateCheckout: true,
      Purchase: true,
      Lead: false,
    });
    expect(browserBlockedMetaEvents(DEFAULT_META_TRACKING, false)).toEqual(["Lead"]);
    expect(browserBlockedMetaEvents(DEFAULT_META_TRACKING, true)).toEqual(["Lead"]);
    expect(orderTimePurchaseDecision(DEFAULT_META_TRACKING, true)).toBe("send");
  });

  it("reads saved keys one by one and ignores bad values", () => {
    const settings = readMetaTrackingSettings({
      pixelId: "123456789012345",
      tracking: { events: { AddToCart: false, Lead: true, Bogus: false, ViewContent: "no" }, purchaseOn: "delivered" },
    });
    expect(settings.events).toEqual({ ViewContent: true, AddToCart: false, InitiateCheckout: true, Purchase: true, Lead: true });
    expect(settings.purchaseOn).toBe("delivered");
    expect(readMetaTrackingSettings({ tracking: { purchaseOn: "later" } }).purchaseOn).toBe("order");
  });

  it("validates the dashboard input", () => {
    expect(validateMetaTrackingInput({ events: { Purchase: false }, purchaseOn: "delivered" })).toEqual({
      success: true,
      data: { events: { ...DEFAULT_META_TRACKING.events, Purchase: false }, purchaseOn: "delivered" },
    });
    expect(validateMetaTrackingInput({})).toEqual({ success: true, data: DEFAULT_META_TRACKING });
    expect(validateMetaTrackingInput({ events: { PageView: false } }).success).toBe(false);
    expect(validateMetaTrackingInput({ purchaseOn: "shipped" }).success).toBe(false);
    expect(validateMetaTrackingInput({ events: {}, extra: 1 }).success).toBe(false);
  });

  it("delivered mode needs CAPI; without it the store keeps Purchase at order", () => {
    expect(effectivePurchaseTiming(delivered, false)).toBe("order");
    expect(effectivePurchaseTiming(delivered, true)).toBe("delivered");
    expect(browserBlockedMetaEvents(delivered, false)).toEqual(["Lead"]);
    expect(browserBlockedMetaEvents(delivered, true)).toEqual(["Lead", "Purchase"]);
    expect(orderTimePurchaseDecision(delivered, false)).toBe("send");
    expect(orderTimePurchaseDecision(delivered, true)).toBe("defer");
  });

  it("Purchase switched off sends nothing in either mode", () => {
    const off = { ...delivered, events: { ...delivered.events, Purchase: false } };
    expect(orderTimePurchaseDecision(off, true)).toBe("skip");
    expect(browserBlockedMetaEvents(off, true)).toEqual(["Purchase", "Lead"]);
  });

  it("the Pixel's public details carry the settings", () => {
    expect(readPublicDetails("meta_pixel", { pixelId: "123456789012345" })).toEqual({ tracking: DEFAULT_META_TRACKING });
  });
});

describe("Purchase on delivery (F-30a)", () => {
  const base = {
    storeId: "11111111-1111-4111-8111-111111111111",
    status: "delivered",
    deliveredAt: "2026-10-30T11:00:00.000Z",
    metadata: { walletPaidAmount: 0, [META_DEFERRED_PURCHASE_KEY]: deferred },
  };

  it("keeps only Meta user_data keys", () => {
    expect(sanitizeMetaUserData({ em: ["h"], ph: "x", phone: "0100", client_ip_address: 5 })).toEqual({ em: ["h"], ph: "x" });
    expect(deferred.userData).toEqual({ em: ["a".repeat(64)], client_ip_address: "1.2.3.4", fbp: "fb.1.1.1" });
    expect(buildDeferredPurchase({}, "javascript:alert(1)").eventSourceUrl).toBeNull();
    expect(readDeferredPurchase({ [META_DEFERRED_PURCHASE_KEY]: deferred })).toEqual(deferred);
    expect(readDeferredPurchase({ [META_DEFERRED_PURCHASE_KEY]: { v: 2 } })).toBeNull();
    expect(readDeferredPurchase(null)).toBeNull();
  });

  it("sends once for a delivered order whose Purchase was deferred", () => {
    const decision = deliveredPurchaseDecision({ order: base, settings: delivered, now: NOW });
    expect(decision).toEqual({ send: true, deferred, eventTime: Date.parse(base.deliveredAt) / 1000 });
    // The seller switching back to "at order" later must not lose the deferred event.
    expect(deliveredPurchaseDecision({ order: base, settings: DEFAULT_META_TRACKING, now: NOW }).send).toBe(true);
  });

  it("never sends for refused, undeferred, already-sent or stale orders", () => {
    const reason = (order: Partial<typeof base>, settings = delivered) => {
      const d = deliveredPurchaseDecision({ order: { ...base, ...order }, settings, now: NOW });
      return d.send ? "send" : d.reason;
    };
    expect(reason({ status: "returned" })).toBe("not_delivered");
    expect(reason({ status: "cancelled" })).toBe("not_delivered");
    expect(reason({ storeId: null as unknown as string })).toBe("no_store");
    // Purchase already went out at checkout ("at order" mode): no snapshot, no second Purchase.
    expect(reason({ metadata: { walletPaidAmount: 0 } })).toBe("not_deferred");
    expect(reason({ metadata: { ...base.metadata, [META_DELIVERED_SENT_KEY]: NOW.toISOString() } })).toBe("already_sent");
    expect(reason({ metadata: { ...base.metadata, [META_DELIVERED_FAILURES_KEY]: 3 } })).toBe("too_many_failures");
    expect(reason({ deliveredAt: "2026-10-23T11:00:00.000Z" })).toBe("too_old");
    expect(reason({}, { ...delivered, events: { ...delivered.events, Purchase: false } })).toBe("purchase_off");
  });

  it("never dates the event in the future", () => {
    const d = deliveredPurchaseDecision({ order: { ...base, deliveredAt: "2026-10-31T00:00:00.000Z" }, settings: delivered, now: NOW });
    expect(d.send && d.eventTime).toBe(NOW.getTime() / 1000);
  });

  it("builds the claim patch and the Purchase with event_id = order id", () => {
    expect(buildDeliveredClaimPatch(NOW)).toEqual({ [META_DELIVERED_SENT_KEY]: NOW.toISOString() });
    const event = buildDeliveredPurchaseEvent({
      orderId: "order-1",
      eventTime: 1_700_000_000,
      deferred,
      totalAmount: "250.50",
      currency: null,
      items: [
        { productId: "p1", quantity: 2 },
        { productId: "p1", quantity: "1" },
        { productId: "p2", quantity: null },
      ],
    });
    expect(event).toEqual({
      event_name: "Purchase",
      event_time: 1_700_000_000,
      event_id: "order-1",
      action_source: "website",
      event_source_url: "https://shop.example.com/checkout",
      user_data: deferred.userData,
      custom_data: {
        content_ids: ["p1", "p2"],
        content_type: "product",
        value: 250.5,
        currency: "EGP",
        num_items: 3,
        order_id: "order-1",
      },
    });
  });
});
