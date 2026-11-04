import { describe, expect, it } from "vitest";
import {
  cartVariantTitle,
  linesForMessage,
  parsePendingCartsFilters,
  pickProductTitle,
  resolvePendingCartContact,
} from "./pending-carts.lib";

const contact = (over = {}) =>
  resolvePendingCartContact({
    isGuest: false,
    userName: null,
    userPhone: null,
    userEmail: null,
    leadName: null,
    leadPhone: null,
    ...over,
  });

describe("resolvePendingCartContact", () => {
  it("shows no name or email for a guest's placeholders", () => {
    const result = contact({ isGuest: true, userName: "Guest User", userEmail: "guest_abc@temp.local" });
    expect(result).toEqual({ name: null, phone: null, whatsappPhone: null, callPhone: null, email: null });
  });

  it("hides a placeholder email even on a row not marked as a guest", () => {
    expect(contact({ userEmail: "guest_abc@temp.local" }).email).toBeNull();
  });

  it("shows a signed-in customer's own details", () => {
    expect(contact({ userName: "Mona Ali", userPhone: "+20 101 234 5678", userEmail: "mona@example.com" })).toEqual({
      name: "Mona Ali",
      phone: "01012345678",
      whatsappPhone: "01012345678",
      callPhone: "01012345678",
      email: "mona@example.com",
    });
  });

  it("takes what was typed at this store's checkout first", () => {
    const result = contact({ userName: "Guest User", userPhone: "01112223333", leadName: "Karim", leadPhone: "01012345678", isGuest: true });
    expect(result.name).toBe("Karim");
    expect(result.phone).toBe("01012345678");
  });

  it("calls but doesn't offer WhatsApp for a phone that isn't an Egyptian mobile", () => {
    const result = contact({ userPhone: "+971 50 123 4567" });
    expect(result.whatsappPhone).toBeNull();
    expect(result.phone).toBe("+971 50 123 4567");
    expect(result.callPhone).toBe("+971501234567");
  });
});

describe("parsePendingCartsFilters", () => {
  it("falls back to safe values", () => {
    expect(parsePendingCartsFilters({})).toEqual({ page: 1, size: 20 });
    expect(parsePendingCartsFilters({ page: "-3", size: "7" })).toEqual({ page: 1, size: 20 });
    expect(parsePendingCartsFilters({ page: ["2"], size: "abc" })).toEqual({ page: 1, size: 20 });
    expect(parsePendingCartsFilters({ page: "0", size: "50" })).toEqual({ page: 1, size: 50 });
  });

  it("reads a real page and size", () => {
    expect(parsePendingCartsFilters({ page: "3", size: "100" })).toEqual({ page: 3, size: 100 });
  });
});

describe("cart line text", () => {
  it("picks the language asked for, else any title", () => {
    expect(pickProductTitle({ ar: "كوب", en: "Mug" }, "en")).toBe("Mug");
    expect(pickProductTitle({ ar: "كوب" }, "en")).toBe("كوب");
    expect(pickProductTitle(null, "ar")).toBeNull();
  });

  it("reads the variant snapshot and skips a title that repeats the product's", () => {
    expect(cartVariantTitle({ title: "Pink", option1: "Design: Pink" }, "Mug")).toBe("Pink");
    expect(cartVariantTitle("Pink", "Mug")).toBe("Pink");
    expect(cartVariantTitle({ title: "Mug" }, "Mug")).toBeNull();
    expect(cartVariantTitle(null, "Mug")).toBeNull();
  });

  it("keeps one entry per line, so the message counts the lines not loaded", () => {
    expect(linesForMessage(["A", "B", "C"], 5)).toHaveLength(5);
    expect(linesForMessage(["A"], 1)).toEqual([{ title: "A" }]);
  });
});
