import { describe, expect, it } from "vitest";
import {
  CHECKOUT_ANSWER_MAX,
  CHECKOUT_FORM_DEFAULTS,
  CHECKOUT_NOTES_MAX,
  CHECKOUT_QUESTION_MAX,
  THANK_YOU_DEFAULTS,
  THANK_YOU_MESSAGE_MAX,
  applyCheckoutAnswers,
  isDefaultCheckoutForm,
  isDefaultThankYou,
  normalizeCheckoutFormInput,
  normalizeThankYouInput,
  parseStoreCheckoutForm,
  parseStoreThankYou,
  thankYouWhatsAppUrl,
  visibleCheckoutFields,
  type StoreCheckoutForm,
} from "./checkout-form.lib";

const form = (patch: Partial<StoreCheckoutForm["fields"]>, extra: Partial<StoreCheckoutForm> = {}): StoreCheckoutForm =>
  normalizeCheckoutFormInput({ fields: { ...CHECKOUT_FORM_DEFAULTS.fields, ...patch }, question: "Size?", ...extra });

describe("parseStoreCheckoutForm", () => {
  it("defaults when nothing is saved or the value is junk", () => {
    for (const settings of [null, undefined, {}, { checkoutForm: null }, { checkoutForm: [] }, { checkoutForm: "x" }]) {
      expect(parseStoreCheckoutForm(settings)).toEqual(CHECKOUT_FORM_DEFAULTS);
    }
    expect(isDefaultCheckoutForm(parseStoreCheckoutForm(null))).toBe(true);
  });

  it("keeps valid modes and drops unknown ones", () => {
    const parsed = normalizeCheckoutFormInput({ fields: { email: "required", secondPhone: "bogus", notes: "hidden", evil: "required" }, question: "x" });
    expect(parsed.fields).toEqual({ email: "required", secondPhone: "hidden", customQuestion: "hidden", notes: "hidden" });
  });

  it("hides the custom question when it has no label, and caps the label", () => {
    expect(normalizeCheckoutFormInput({ fields: { customQuestion: "required" }, question: "   " }).fields.customQuestion).toBe("hidden");
    const long = normalizeCheckoutFormInput({ fields: { customQuestion: "optional" }, question: "a".repeat(200) });
    expect(long.question).toHaveLength(CHECKOUT_QUESTION_MAX);
    expect(long.fields.customQuestion).toBe("optional");
    expect(normalizeCheckoutFormInput({ question: "<b>Hi</b>\nthere\u0000" }).question).toBe("<b>Hi</b> there");
  });

  it("keeps every field once in the order, filling missing ones", () => {
    expect(normalizeCheckoutFormInput({ order: ["notes", "notes", "x", "email"] }).order).toEqual(["notes", "email", "secondPhone", "customQuestion"]);
  });
});

describe("visibleCheckoutFields", () => {
  it("lists shown fields in the seller's order with required flags", () => {
    const f = form({ email: "required", secondPhone: "optional", notes: "hidden" }, { order: ["secondPhone", "notes", "email", "customQuestion"] });
    expect(visibleCheckoutFields(f)).toEqual([
      { key: "secondPhone", required: false },
      { key: "email", required: true },
    ]);
  });

  it("defaults to the optional notes box only", () => {
    expect(visibleCheckoutFields(CHECKOUT_FORM_DEFAULTS)).toEqual([{ key: "notes", required: false }]);
  });
});

describe("applyCheckoutAnswers", () => {
  it("passes notes through untouched with the default form, ignoring extras", () => {
    expect(applyCheckoutAnswers(CHECKOUT_FORM_DEFAULTS, { notes: "  ring the bell  ", email: "a@b.co", customAnswer: "x" })).toEqual({ ok: true, notes: "  ring the bell  " });
    expect(applyCheckoutAnswers(CHECKOUT_FORM_DEFAULTS, { notes: "" })).toEqual({ ok: true, notes: "" });
    expect(applyCheckoutAnswers(CHECKOUT_FORM_DEFAULTS, {})).toEqual({ ok: true, notes: undefined });
  });

  it("ignores hidden fields whatever is sent", () => {
    const f = form({ email: "optional", notes: "hidden" });
    expect(applyCheckoutAnswers(f, { notes: "secret", secondPhone: "01012345678", customAnswer: "L" })).toEqual({ ok: true, notes: undefined });
  });

  it("enforces required fields", () => {
    expect(applyCheckoutAnswers(form({ email: "required" }), { email: " " })).toMatchObject({ ok: false, error: "emailRequired" });
    expect(applyCheckoutAnswers(form({ secondPhone: "required" }), {})).toMatchObject({ ok: false, error: "secondPhoneRequired" });
    expect(applyCheckoutAnswers(form({ customQuestion: "required" }), { customAnswer: "\u0000 " })).toMatchObject({ ok: false, error: "customAnswerRequired" });
    expect(applyCheckoutAnswers(form({ notes: "required", email: "optional" }), { notes: "  " })).toMatchObject({ ok: false, error: "notesRequired" });
  });

  it("validates email and second phone", () => {
    expect(applyCheckoutAnswers(form({ email: "optional" }), { email: "not-an-email" })).toMatchObject({ ok: false, field: "email", error: "emailInvalid" });
    expect(applyCheckoutAnswers(form({ secondPhone: "optional" }), { secondPhone: "12345" })).toMatchObject({ ok: false, error: "secondPhoneInvalid" });
    expect(applyCheckoutAnswers(form({ email: "optional" }), { email: 42 })).toEqual({ ok: true, notes: undefined });
  });

  it("writes the answers into the notes in the form's order, then the customer's note", () => {
    const f = form(
      { email: "optional", secondPhone: "required", customQuestion: "required", notes: "optional" },
      { order: ["customQuestion", "secondPhone", "notes", "email"] },
    );
    const result = applyCheckoutAnswers(f, { email: " Ali@Mail.COM ", secondPhone: "+20 101 234 5678", customAnswer: "XL", notes: " leave at door " });
    expect(result).toEqual({
      ok: true,
      notes: "Size?: XL\nرقم تليفون آخر / Second phone: 01012345678\nالبريد الإلكتروني / Email: ali@mail.com\n\nleave at door",
    });
  });

  it("caps the custom answer", () => {
    const result = applyCheckoutAnswers(form({ customQuestion: "optional", notes: "hidden" }), { customAnswer: "x".repeat(1000) });
    expect(result.ok && result.notes).toBe(`Size?: ${"x".repeat(CHECKOUT_ANSWER_MAX)}`);
  });

  it("caps and cleans the customer's note with a custom form", () => {
    const result = applyCheckoutAnswers(form({ email: "optional" }), { notes: `a\u0000b\n\n\n\nc${"z".repeat(2000)}` });
    expect(result.ok).toBe(true);
    const notes = result.ok ? (result.notes ?? "") : "";
    expect(notes.startsWith("ab\n\nc")).toBe(true);
    expect(notes).toHaveLength(CHECKOUT_NOTES_MAX);
  });
});

describe("thank-you settings", () => {
  it("defaults and cleans the message", () => {
    expect(parseStoreThankYou(null)).toEqual(THANK_YOU_DEFAULTS);
    expect(isDefaultThankYou(parseStoreThankYou({ thankYou: {} }))).toBe(true);
    const parsed = normalizeThankYouInput({ message: `Thanks!\r\n\n\n\nSee you\u0007 ${"y".repeat(900)}`, whatsappButton: "true", suggestedProducts: true });
    expect(parsed.message.startsWith("Thanks!\n\nSee you ")).toBe(true);
    expect(parsed.message.length).toBeLessThanOrEqual(THANK_YOU_MESSAGE_MAX);
    expect(parsed.whatsappButton).toBe(false);
    expect(parsed.suggestedProducts).toBe(true);
  });

  it("builds the WhatsApp link with the order number", () => {
    const url = thankYouWhatsAppUrl({ storePhone: "010 1234 5678", storeName: "Nour $1", orderNumber: "TB-123", locale: "en" });
    expect(url).toBe(`https://wa.me/201012345678?text=${encodeURIComponent("Hi Nour $1, I placed order #TB-123 and would like to confirm it.")}`);
    expect(thankYouWhatsAppUrl({ storePhone: "+44 20 1234", storeName: "x", orderNumber: "1", locale: "ar" })).toBeNull();
    expect(thankYouWhatsAppUrl({ storePhone: null, storeName: "x", orderNumber: "1", locale: "ar" })).toBeNull();
  });
});
