import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Minimal browser globals: the bus only needs window.location, fbq, gtag and dataLayer. */
function fakeWindow(host: string) {
  const win = { location: { host } } as unknown as Window & typeof globalThis;
  vi.stubGlobal("window", win);
  return win;
}

describe("trackCommerceEvent (P7-04)", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it("on the marketplace only calls Tallaby's Meta pixel, immediately", async () => {
    const win = fakeWindow("www.tallaby.com");
    const fbq = vi.fn();
    const gtag = vi.fn();
    Object.assign(win, { fbq, gtag, dataLayer: [] });
    const { trackCommerceEvent } = await import("./storefront-events.client");

    trackCommerceEvent("AddToCart", { content_ids: ["p1"], value: 10, currency: "EGP" });
    expect(fbq).toHaveBeenCalledWith("track", "AddToCart", { content_ids: ["p1"], value: 10, currency: "EGP" });
    expect(gtag).not.toHaveBeenCalled();
    expect(win.dataLayer).toEqual([]);
  });

  it("on a store host queues events until the store's trackers are ready", async () => {
    const win = fakeWindow("faster.tallaby.com");
    const { markStoreTrackingReady, trackCommerceEvent } = await import("./storefront-events.client");

    trackCommerceEvent("Purchase", { content_ids: ["p1", "p2"], value: 250, currency: "EGP" }, { eventId: "order-1" });
    const fbq = vi.fn();
    const gtag = vi.fn();
    Object.assign(win, { fbq, gtag, dataLayer: [] });
    expect(fbq).not.toHaveBeenCalled();

    markStoreTrackingReady();
    expect(fbq).toHaveBeenCalledWith(
      "track",
      "Purchase",
      { content_ids: ["p1", "p2"], value: 250, currency: "EGP" },
      { eventID: "order-1" },
    );
    const ecommerce = { currency: "EGP", value: 250, transaction_id: "order-1", items: [{ item_id: "p1" }, { item_id: "p2" }] };
    expect(gtag).toHaveBeenCalledWith("event", "purchase", ecommerce);
    expect(win.dataLayer).toEqual([{ ecommerce: null }, { event: "purchase", ecommerce }]);

    // After ready, events go straight through.
    trackCommerceEvent("ViewContent", { content_ids: ["p3"], value: 5, currency: "EGP" });
    expect(gtag).toHaveBeenLastCalledWith("event", "view_item", { currency: "EGP", value: 5, items: [{ item_id: "p3" }] });
  });

  it("drops the store's blocked Meta events (F-30) but keeps GA4", async () => {
    const win = fakeWindow("faster.tallaby.com");
    const { markStoreTrackingReady, setStoreMetaBlockedEvents, trackCommerceEvent } = await import(
      "./storefront-events.client"
    );
    trackCommerceEvent("Purchase", { content_ids: ["p1"], value: 10, currency: "EGP" }, { eventId: "order-2" });
    const fbq = vi.fn();
    const gtag = vi.fn();
    Object.assign(win, { fbq, gtag });
    setStoreMetaBlockedEvents(["Purchase", "Lead"]);
    markStoreTrackingReady();
    trackCommerceEvent("Lead", { value: 10, currency: "EGP" }, { eventId: "lead-cart" });
    trackCommerceEvent("AddToCart", { content_ids: ["p1"], value: 10, currency: "EGP" });

    expect(fbq).toHaveBeenCalledTimes(1);
    expect(fbq).toHaveBeenCalledWith("track", "AddToCart", { content_ids: ["p1"], value: 10, currency: "EGP" });
    expect(gtag).toHaveBeenCalledWith("event", "purchase", expect.objectContaining({ transaction_id: "order-2" }));
    expect(gtag).not.toHaveBeenCalledWith("event", "generate_lead", expect.anything());
  });

  it("sends the commerce events to the store's TikTok and Snap pixels with the shared event id (F-103)", async () => {
    const win = fakeWindow("faster.tallaby.com");
    const { markStoreTrackingReady, setStoreMetaBlockedEvents, trackCommerceEvent } = await import(
      "./storefront-events.client"
    );
    trackCommerceEvent(
      "Purchase",
      { content_ids: ["p1", "p2"], content_type: "product", value: 250, currency: "EGP", num_items: 3 },
      { eventId: "order-1" },
    );
    const fbq = vi.fn();
    const track = vi.fn();
    const ttq = { track };
    const snaptr = vi.fn();
    Object.assign(win, { fbq, ttq, snaptr });
    // A Meta-only block never reaches TikTok or Snap.
    setStoreMetaBlockedEvents(["Purchase"]);
    markStoreTrackingReady();

    expect(fbq).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith(
      "Purchase",
      {
        contents: [{ content_id: "p1" }, { content_id: "p2" }],
        content_type: "product",
        content_ids: ["p1", "p2"],
        value: 250,
        currency: "EGP",
        num_items: 3,
      },
      { event_id: "order-1" },
    );
    expect(snaptr).toHaveBeenCalledWith("track", "PURCHASE", {
      item_ids: ["p1", "p2"],
      price: 250,
      currency: "EGP",
      number_items: 3,
      transaction_id: "order-1",
      client_dedup_id: "order-1",
    });

    trackCommerceEvent("Lead", { value: 10, currency: "EGP" }, { eventId: "lead-1" });
    expect(track).toHaveBeenCalledTimes(1);
    expect(snaptr).toHaveBeenCalledTimes(1);
  });

  it("keeps the store working when a pixel throws", async () => {
    const win = fakeWindow("faster.tallaby.com");
    const { markStoreTrackingReady, trackCommerceEvent } = await import("./storefront-events.client");
    const gtag = vi.fn();
    Object.assign(win, {
      gtag,
      ttq: { track: () => { throw new Error("blocked"); } },
      snaptr: () => { throw new Error("blocked"); },
    });
    markStoreTrackingReady();
    expect(() => trackCommerceEvent("AddToCart", { content_ids: ["p1"], value: 10, currency: "EGP" })).not.toThrow();
    expect(gtag).toHaveBeenCalledWith("event", "add_to_cart", { currency: "EGP", value: 10, items: [{ item_id: "p1" }] });
  });

  it("does nothing on the server", async () => {
    vi.stubGlobal("window", undefined);
    const { trackCommerceEvent } = await import("./storefront-events.client");
    expect(() => trackCommerceEvent("AddToCart", {})).not.toThrow();
  });
});

describe("TikTok and Snap mappers (F-103)", () => {
  it("maps the four commerce events and nothing else", async () => {
    const { toSnapEvent, toTiktokEvent } = await import("./storefront-events.client");
    const names = ["ViewContent", "AddToCart", "InitiateCheckout", "Purchase", "Lead", "PageView", "CompleteRegistration"] as const;
    expect(names.map((name) => toTiktokEvent(name, {})?.event ?? null)).toEqual([
      "ViewContent",
      "AddToCart",
      "InitiateCheckout",
      "Purchase",
      null,
      null,
      null,
    ]);
    expect(names.map((name) => toSnapEvent(name, {})?.event ?? null)).toEqual([
      "VIEW_CONTENT",
      "ADD_CART",
      "START_CHECKOUT",
      "PURCHASE",
      null,
      null,
      null,
    ]);
  });

  it("uses line quantities and prices when given, and never sends empty or undefined fields", async () => {
    const { toSnapEvent, toTiktokEvent } = await import("./storefront-events.client");
    const params = { contents: [{ id: "p1", quantity: 2, item_price: 50 }], value: 100, currency: "EGP" };
    expect(toTiktokEvent("AddToCart", params)).toEqual({
      event: "AddToCart",
      properties: {
        contents: [{ content_id: "p1", quantity: 2, price: 50 }],
        content_type: "product",
        content_ids: ["p1"],
        value: 100,
        currency: "EGP",
      },
    });
    expect(toSnapEvent("AddToCart", params)).toEqual({ event: "ADD_CART", params: { item_ids: ["p1"], price: 100, currency: "EGP" } });

    // No event id: no dedup id, no transaction id, no options. NaN value dropped.
    expect(toSnapEvent("Purchase", { content_ids: ["p1"], value: Number.NaN })).toEqual({ event: "PURCHASE", params: { item_ids: ["p1"] } });
    expect(toTiktokEvent("ViewContent", { content_ids: ["p1"] })).not.toHaveProperty("options");
    // Only Purchase carries a Snap transaction id.
    expect(toSnapEvent("InitiateCheckout", { content_ids: ["p1"] }, { eventId: "cart-1" })).toEqual({
      event: "START_CHECKOUT",
      params: { item_ids: ["p1"], client_dedup_id: "cart-1" },
    });
  });
});
