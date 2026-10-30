import { describe, expect, it } from "vitest";
import { CHECKOUT_FORM_DEFAULTS, THANK_YOU_DEFAULTS } from "@workspace/lib/stores/checkout-form";
import { parseStoreCheckoutSettingsInput } from "./checkout-settings.dto";

const valid = () => ({
  checkoutForm: {
    fields: { ...CHECKOUT_FORM_DEFAULTS.fields, email: "required" as const },
    order: ["email", "notes", "secondPhone", "customQuestion"] as const,
    question: "",
  },
  thankYou: { ...THANK_YOU_DEFAULTS, message: "  Thanks!  ", whatsappButton: true },
});

describe("parseStoreCheckoutSettingsInput", () => {
  it("accepts and cleans a valid save", () => {
    const result = parseStoreCheckoutSettingsInput(valid());
    expect(result).toEqual({
      ok: true,
      value: {
        checkoutForm: { fields: { ...CHECKOUT_FORM_DEFAULTS.fields, email: "required" }, order: ["email", "notes", "secondPhone", "customQuestion"], question: "" },
        thankYou: { message: "Thanks!", whatsappButton: true, suggestedProducts: false },
      },
    });
  });

  it("refuses unknown modes, keys and oversized text", () => {
    const badMode = valid() as any;
    badMode.checkoutForm.fields.email = "shown";
    expect(parseStoreCheckoutSettingsInput(badMode)).toEqual({ ok: false, error: "invalid" });
    expect(parseStoreCheckoutSettingsInput({ ...valid(), extra: 1 })).toEqual({ ok: false, error: "invalid" });
    const long = valid();
    long.thankYou.message = "x".repeat(501);
    expect(parseStoreCheckoutSettingsInput(long)).toEqual({ ok: false, error: "invalid" });
    expect(parseStoreCheckoutSettingsInput(null)).toEqual({ ok: false, error: "invalid" });
  });

  it("needs a label for a shown custom question", () => {
    const input = valid() as any;
    input.checkoutForm.fields.customQuestion = "required";
    input.checkoutForm.question = "   ";
    expect(parseStoreCheckoutSettingsInput(input)).toEqual({ ok: false, error: "questionRequired" });
    input.checkoutForm.question = "Which size?";
    const result = parseStoreCheckoutSettingsInput(input);
    expect(result.ok && result.value.checkoutForm.fields.customQuestion).toBe("required");
  });
});
