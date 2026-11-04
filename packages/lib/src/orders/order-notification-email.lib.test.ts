import { describe, expect, it } from "vitest";
import {
  isRealEmail,
  ORDER_EMAIL_MAX,
  orderEmailFieldVisible,
  orderEmailRecipient,
  parseOptionalOrderEmail,
} from "./order-notification-email.lib";

describe("checkout email field", () => {
  it("shows only on a subscribed store", () => {
    expect(orderEmailFieldVisible({ subscribed: false, isGuest: true, accountEmail: null })).toBe(false);
    expect(orderEmailFieldVisible({ subscribed: true, isGuest: true, accountEmail: "g-1@temp.local" })).toBe(true);
  });

  it("doesn't ask a signed-in customer who has an email", () => {
    expect(orderEmailFieldVisible({ subscribed: true, isGuest: false, accountEmail: "sara@example.com" })).toBe(false);
    expect(orderEmailFieldVisible({ subscribed: true, isGuest: false, accountEmail: null })).toBe(true);
    expect(orderEmailFieldVisible({ subscribed: true, isGuest: false, accountEmail: "x@temp.local" })).toBe(true);
  });
});

describe("optional email", () => {
  it("accepts blank", () => {
    expect(parseOptionalOrderEmail("")).toEqual({ ok: true, email: null });
    expect(parseOptionalOrderEmail("   ")).toEqual({ ok: true, email: null });
    expect(parseOptionalOrderEmail(undefined)).toEqual({ ok: true, email: null });
  });

  it("trims a valid address", () => {
    expect(parseOptionalOrderEmail(" sara@example.com ")).toEqual({ ok: true, email: "sara@example.com" });
  });

  it("refuses a bad one", () => {
    for (const bad of ["sara", "sara@", "a b@example.com", "x@temp.local", 5, `${"a".repeat(ORDER_EMAIL_MAX)}@example.com`]) {
      expect(parseOptionalOrderEmail(bad)).toEqual({ ok: false });
    }
  });
});

describe("order email recipient", () => {
  it("prefers the address on the order", () => {
    expect(orderEmailRecipient({ metadata: { notificationEmail: "sara@example.com" }, accountEmail: "g@temp.local" })).toBe(
      "sara@example.com",
    );
  });

  it("falls back to a real account email, and never a placeholder", () => {
    expect(orderEmailRecipient({ metadata: null, accountEmail: " a@example.com " })).toBe("a@example.com");
    expect(orderEmailRecipient({ metadata: {}, accountEmail: "g@temp.local" })).toBeNull();
    expect(orderEmailRecipient({ metadata: { notificationEmail: "junk" }, accountEmail: null })).toBeNull();
  });

  it("knows a placeholder isn't real", () => {
    expect(isRealEmail("g@temp.local")).toBe(false);
    expect(isRealEmail("")).toBe(false);
    expect(isRealEmail("a@example.com")).toBe(true);
  });
});
