import { describe, expect, it } from "vitest";
import {
  WHATSAPP_BUTTON_DEFAULTS,
  normalizeWhatsAppButtonInput,
  parseStoreWhatsAppButton,
  whatsAppButtonDigits,
  whatsAppButtonHref,
  whatsAppButtonShowsOn,
} from "./whatsapp-button.lib";

describe("parseStoreWhatsAppButton", () => {
  it("returns the defaults when nothing usable is saved", () => {
    for (const settings of [null, undefined, {}, { other: 1 }, { whatsappButton: null }, { whatsappButton: [] }, { whatsappButton: "on" }]) {
      expect(parseStoreWhatsAppButton(settings)).toEqual(WHATSAPP_BUTTON_DEFAULTS);
    }
    expect(WHATSAPP_BUTTON_DEFAULTS).toEqual({
      phone: null,
      message: "",
      position: "right",
      devices: "all",
      size: "medium",
      offsetDesktop: 24,
      offsetMobile: 88,
      label: "",
      showOnCart: false,
    });
  });

  it("keeps valid values and re-validates every field", () => {
    expect(
      parseStoreWhatsAppButton({
        whatsappButton: {
          phone: "+20 100 123 4567",
          message: "  Hi \u0007there\nfriend  ",
          position: "left",
          devices: "mobile",
          size: "large",
          offsetDesktop: "40",
          offsetMobile: 120.6,
          label: "  Chat\n with   us ",
          showOnCart: true,
        },
      }),
    ).toEqual({
      phone: "01001234567",
      message: "Hi there\nfriend",
      position: "left",
      devices: "mobile",
      size: "large",
      offsetDesktop: 40,
      offsetMobile: 121,
      label: "Chat with us",
      showOnCart: true,
    });
  });

  it("drops unknown values, clamps offsets and caps text", () => {
    const parsed = parseStoreWhatsAppButton({
      whatsappButton: {
        phone: "not a phone",
        position: "top",
        devices: "tv",
        size: "huge",
        offsetDesktop: -5,
        offsetMobile: 9999,
        message: "x".repeat(400),
        label: "y".repeat(60),
        showOnCart: "yes",
      },
    });
    expect(parsed.phone).toBeNull();
    expect(parsed.position).toBe("right");
    expect(parsed.devices).toBe("all");
    expect(parsed.size).toBe("medium");
    expect(parsed.offsetDesktop).toBe(0);
    expect(parsed.offsetMobile).toBe(200);
    expect(parsed.message).toHaveLength(300);
    expect(parsed.label).toHaveLength(40);
    expect(parsed.showOnCart).toBe(false);
    expect(parseStoreWhatsAppButton({ whatsappButton: { offsetDesktop: "abc", offsetMobile: null } })).toMatchObject({ offsetDesktop: 24, offsetMobile: 88 });
  });
});

describe("normalizeWhatsAppButtonInput", () => {
  it("refuses a typed number that isn't valid", () => {
    expect(normalizeWhatsAppButtonInput({ phone: "12" })).toEqual({ success: false, error: "invalidPhone" });
  });

  it("accepts an empty number as the store's own and cleans the rest", () => {
    const result = normalizeWhatsAppButtonInput({ phone: "  ", size: "small", extra: "<script>" });
    expect(result).toEqual({ success: true, settings: { ...WHATSAPP_BUTTON_DEFAULTS, size: "small" } });
    expect(normalizeWhatsAppButtonInput(null)).toEqual({ success: true, settings: WHATSAPP_BUTTON_DEFAULTS });
  });
});

describe("whatsAppButtonDigits", () => {
  it("uses the app's number, then the contact WhatsApp, then the phone", () => {
    expect(whatsAppButtonDigits({ phone: "01001234567" }, { whatsapp: "01111111111", phone: "01222222222" })).toBe("201001234567");
    expect(whatsAppButtonDigits({ phone: null }, { whatsapp: "٠١١١١١١١١١١", phone: "01222222222" })).toBe("201111111111");
    expect(whatsAppButtonDigits({ phone: null }, { whatsapp: "nope", phone: "+966 50 123 4567" })).toBe("966501234567");
    expect(whatsAppButtonDigits({ phone: null }, { whatsapp: "", phone: null })).toBeNull();
    expect(whatsAppButtonDigits({ phone: null }, {})).toBeNull();
  });
});

describe("whatsAppButtonHref", () => {
  it("links to wa.me with the text URL-encoded", () => {
    expect(whatsAppButtonHref("201001234567", "")).toBe("https://wa.me/201001234567");
    expect(whatsAppButtonHref("201001234567", "مرحبا & hi?")).toBe(
      `https://wa.me/201001234567?text=${encodeURIComponent("مرحبا & hi?")}`,
    );
  });
});

describe("whatsAppButtonShowsOn", () => {
  it("shows on store pages", () => {
    for (const path of ["/", "/products", "/products/shoe", "/pages/about", null]) {
      expect(whatsAppButtonShowsOn({ showOnCart: false }, path), String(path)).toBe(true);
    }
  });

  it("shows on cart and checkout only when asked", () => {
    for (const path of ["/cart", "/checkout", "/checkout/step"]) {
      expect(whatsAppButtonShowsOn({ showOnCart: false }, path), path).toBe(false);
      expect(whatsAppButtonShowsOn({ showOnCart: true }, path), path).toBe(true);
    }
  });

  it("never shows on account, orders or sign-in pages", () => {
    for (const path of ["/orders", "/orders/123", "/profile", "/account", "/auth/login", "/sign-in", "/wishlist", "/payment", "/thank-you"]) {
      expect(whatsAppButtonShowsOn({ showOnCart: true }, path), path).toBe(false);
    }
  });
});
