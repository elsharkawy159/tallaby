import { describe, expect, it } from "vitest";
import {
  effectiveStoreWhatsApp,
  formatWhatsAppTotal,
  isWhatsAppOptedOut,
  readWhatsAppConsent,
  resolveWhatsAppLocale,
  whatsAppCarrierLabel,
  whatsAppGateFailure,
  whatsAppReplyText,
  type WhatsAppGateInput,
} from "./order-message.lib";
import { WHATSAPP_EVENTS } from "./events.lib";

describe("readWhatsAppConsent", () => {
  it("reads the checkout consent", () => {
    expect(readWhatsAppConsent({ whatsapp: { optIn: true, locale: "en", at: "2026-11-26T10:00:00Z" } })).toEqual({
      optIn: true,
      locale: "en",
      at: "2026-11-26T10:00:00Z",
    });
  });
  it("treats anything else as no consent", () => {
    for (const metadata of [null, undefined, [], "x", {}, { whatsapp: "yes" }, { whatsapp: { optIn: "true" } }]) {
      expect(readWhatsAppConsent(metadata).optIn).toBe(false);
    }
    expect(readWhatsAppConsent({ whatsapp: { optIn: true, locale: "fr", at: "not a date" } })).toEqual({ optIn: true, locale: null, at: null });
  });
});

describe("resolveWhatsAppLocale", () => {
  it("prefers checkout, then the store, then Arabic", () => {
    expect(resolveWhatsAppLocale("en", "ar")).toBe("en");
    expect(resolveWhatsAppLocale(null, "en")).toBe("en");
    expect(resolveWhatsAppLocale("fr", "de")).toBe("ar");
  });
});

describe("formatWhatsAppTotal", () => {
  it("formats in the order currency", () => {
    expect(formatWhatsAppTotal("450.00", "EGP", "en")).toMatch(/EGP\s?450/);
    expect(formatWhatsAppTotal("12.5", "SAR", "en")).toMatch(/SAR\s?12\.5/);
    expect(formatWhatsAppTotal("450", null, "ar")).toContain("٤٥٠");
  });
  it("never throws on bad input", () => {
    expect(formatWhatsAppTotal("abc", "egp", "en")).toMatch(/EGP\s?0/);
  });
});

describe("whatsAppCarrierLabel", () => {
  it("names Bosta and the store's own delivery", () => {
    expect(whatsAppCarrierLabel("bosta", "en")).toBe("Bosta");
    expect(whatsAppCarrierLabel("seller", "ar")).toBe("المتجر");
    expect(whatsAppCarrierLabel(null, "en")).toBe("The store");
    expect(whatsAppCarrierLabel("Aramex", "en")).toBe("Aramex");
  });
});

describe("effectiveStoreWhatsApp", () => {
  it("uses the store row, else the admin default with every event", () => {
    expect(effectiveStoreWhatsApp({ enabled: true, events: ["order_placed"] }, { storesDefaultOn: false })).toEqual({
      enabled: true,
      events: ["order_placed"],
    });
    expect(effectiveStoreWhatsApp(null, { storesDefaultOn: true })).toEqual({ enabled: true, events: [...WHATSAPP_EVENTS] });
  });
});

describe("isWhatsAppOptedOut", () => {
  it("is global until a later opt-in", () => {
    expect(isWhatsAppOptedOut(null)).toBe(false);
    expect(isWhatsAppOptedOut({ optedInAt: null, optedOutAt: "2026-11-02T00:00:00Z" })).toBe(true);
    expect(isWhatsAppOptedOut({ optedInAt: "2026-11-01T00:00:00Z", optedOutAt: "2026-11-02T00:00:00Z" })).toBe(true);
    expect(isWhatsAppOptedOut({ optedInAt: "2026-11-03T00:00:00Z", optedOutAt: "2026-11-02T00:00:00Z" })).toBe(false);
    expect(isWhatsAppOptedOut({ optedInAt: null, optedOutAt: "2026-11-02T00:00:00Z" }, "2026-11-04T00:00:00Z")).toBe(false);
  });
});

describe("whatsAppGateFailure", () => {
  const ok: WhatsAppGateInput = {
    configured: true,
    settings: { enabled: true, storesDefaultOn: false, eventsEnabled: [...WHATSAPP_EVENTS], metaRateMicros: {}, sellerPriceUsdCents: 0 },
    event: "order_placed",
    order: { storeId: "s", isTest: false, status: "pending" },
    store: { enabled: true, events: [...WHATSAPP_EVENTS] },
    consent: { optIn: true, locale: "ar", at: null },
    phone: "201012345678",
    contact: null,
  };

  it("passes when every gate holds", () => {
    expect(whatsAppGateFailure(ok)).toBeNull();
  });

  it("stops at each gate", () => {
    expect(whatsAppGateFailure({ ...ok, configured: false })).toBe("not_configured");
    expect(whatsAppGateFailure({ ...ok, settings: null })).toBe("disabled");
    expect(whatsAppGateFailure({ ...ok, settings: { ...ok.settings!, enabled: false } })).toBe("disabled");
    expect(whatsAppGateFailure({ ...ok, settings: { ...ok.settings!, eventsEnabled: [] } })).toBe("event_disabled");
    expect(whatsAppGateFailure({ ...ok, order: null })).toBe("order_not_found");
    expect(whatsAppGateFailure({ ...ok, order: { ...ok.order!, storeId: null } })).toBe("no_store");
    expect(whatsAppGateFailure({ ...ok, order: { ...ok.order!, isTest: true } })).toBe("test_order");
    expect(whatsAppGateFailure({ ...ok, order: { ...ok.order!, status: "payment_processing" } })).toBe("awaiting_payment");
    expect(whatsAppGateFailure({ ...ok, store: null })).toBe("store_disabled");
    expect(whatsAppGateFailure({ ...ok, store: { enabled: true, events: ["order_shipped"] } })).toBe("store_event_disabled");
    expect(whatsAppGateFailure({ ...ok, consent: { optIn: false, locale: null, at: null } })).toBe("no_consent");
    expect(whatsAppGateFailure({ ...ok, phone: null })).toBe("invalid_phone");
    expect(whatsAppGateFailure({ ...ok, contact: { optedInAt: null, optedOutAt: "2026-01-01T00:00:00Z" } })).toBe("opted_out");
  });

  it("skips the confirmed and cancelled templates after a button tap only", () => {
    expect(whatsAppGateFailure({ ...ok, event: "order_confirmed", byCustomerButton: true })).toBe("by_customer");
    expect(whatsAppGateFailure({ ...ok, event: "order_cancelled", byCustomerButton: true })).toBe("by_customer");
    expect(whatsAppGateFailure({ ...ok, event: "order_shipped", byCustomerButton: true })).toBeNull();
  });
});

describe("whatsAppReplyText", () => {
  it("names the order and the store in both languages", () => {
    for (const locale of ["ar", "en"] as const) {
      for (const kind of ["confirmed", "cancelled", "already_confirmed", "already_cancelled", "refused"] as const) {
        const text = whatsAppReplyText(kind, locale, { orderNumber: "TB-1", storeName: "Rose" });
        expect(text).toContain("TB-1");
        expect(text).toContain("Rose");
      }
      expect(whatsAppReplyText("opted_out", locale).length).toBeGreaterThan(10);
    }
  });
  it("flattens and caps store-supplied names", () => {
    const text = whatsAppReplyText("confirmed", "en", { orderNumber: "1", storeName: `A\n\nB${"x".repeat(100)}` });
    expect(text).not.toContain("\n");
    expect(text).toContain("A B");
  });
});
