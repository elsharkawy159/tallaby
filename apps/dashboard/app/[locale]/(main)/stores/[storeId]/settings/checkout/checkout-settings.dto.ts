import { z } from "zod";
import {
  CHECKOUT_FIELDS,
  CHECKOUT_FIELD_MODES,
  CHECKOUT_QUESTION_MAX,
  THANK_YOU_MESSAGE_MAX,
  normalizeCheckoutFormInput,
  normalizeThankYouInput,
  type StoreCheckoutForm,
  type StoreThankYou,
} from "@workspace/lib/stores/checkout-form";

/**
 * Store settings › Checkout (ROADMAP.md F-25): the save input. Zod checks the
 * shape; the shared normalizers then clean every value again, so what is
 * stored is exactly what the storefront would parse.
 */

const mode = z.enum(CHECKOUT_FIELD_MODES);

export const storeCheckoutSettingsSchema = z
  .object({
    checkoutForm: z.object({
      fields: z.object({ email: mode, secondPhone: mode, customQuestion: mode, notes: mode }),
      order: z.array(z.enum(CHECKOUT_FIELDS)).max(CHECKOUT_FIELDS.length),
      question: z.string().max(CHECKOUT_QUESTION_MAX),
    }),
    thankYou: z.object({
      message: z.string().max(THANK_YOU_MESSAGE_MAX),
      whatsappButton: z.boolean(),
      suggestedProducts: z.boolean(),
    }),
  })
  .strict();

export type StoreCheckoutSettings = { checkoutForm: StoreCheckoutForm; thankYou: StoreThankYou };

export type StoreCheckoutSettingsInputError = "invalid" | "questionRequired";

export function parseStoreCheckoutSettingsInput(
  input: unknown,
): { ok: true; value: StoreCheckoutSettings } | { ok: false; error: StoreCheckoutSettingsInputError } {
  const parsed = storeCheckoutSettingsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { checkoutForm, thankYou } = parsed.data;
  // A shown question needs its label (the normalizer would silently hide it).
  if (checkoutForm.fields.customQuestion !== "hidden" && !checkoutForm.question.trim()) {
    return { ok: false, error: "questionRequired" };
  }
  return {
    ok: true,
    value: { checkoutForm: normalizeCheckoutFormInput(checkoutForm), thankYou: normalizeThankYouInput(thankYou) },
  };
}
