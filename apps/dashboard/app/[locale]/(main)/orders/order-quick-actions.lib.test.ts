import { describe, expect, it } from "vitest";
import { orderQuickContacts } from "./order-quick-actions.lib";

const chatText = "Hi, about your order #1001";

describe("orderQuickContacts", () => {
  it("uses the ask-to-confirm message when the order has one", () => {
    const res = orderQuickContacts({ phone: "01012345678", confirmMessage: "Confirm #1001?", chatText });
    expect(res.whatsapp).toEqual({
      url: `https://wa.me/201012345678?text=${encodeURIComponent("Confirm #1001?")}`,
      ask: true,
    });
    expect(res.tel).toBe("tel:01012345678");
  });

  it("falls back to a plain chat without a confirm message", () => {
    const res = orderQuickContacts({ phone: "01012345678", confirmMessage: null, chatText });
    expect(res.whatsapp).toEqual({
      url: `https://wa.me/201012345678?text=${encodeURIComponent(chatText)}`,
      ask: false,
    });
  });

  it("shows no contact buttons without a phone", () => {
    expect(orderQuickContacts({ phone: null, confirmMessage: "Confirm?", chatText })).toEqual({
      whatsapp: null,
      tel: null,
    });
    expect(orderQuickContacts({ phone: "", confirmMessage: null, chatText })).toEqual({ whatsapp: null, tel: null });
  });

  it("keeps Call when the number can't open WhatsApp", () => {
    const res = orderQuickContacts({ phone: "0123", confirmMessage: null, chatText });
    expect(res.whatsapp).toBeNull();
    expect(res.tel).toBe("tel:0123");
  });
});
