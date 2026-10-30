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

  it("does nothing on the server", async () => {
    vi.stubGlobal("window", undefined);
    const { trackCommerceEvent } = await import("./storefront-events.client");
    expect(() => trackCommerceEvent("AddToCart", {})).not.toThrow();
  });
});
