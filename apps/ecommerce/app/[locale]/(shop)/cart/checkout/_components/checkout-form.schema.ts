import { z } from "zod";

export const createCheckoutFormSchema = (t: (key: string) => string) => z.object({
  // Saved from the simple form just before the order is placed (F-64).
  shippingAddressId: z.string().optional(),
  billingAddressId: z.string().optional(),
  paymentMethod: z.string().min(1, t("paymentMethodRequired")),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  isGift: z.boolean().optional(),
  giftMessage: z.string().optional(),
});

export type CheckoutFormData = z.infer<ReturnType<typeof createCheckoutFormSchema>>;

export const checkoutFormDefaults: Partial<CheckoutFormData> = {
  shippingAddressId: "",
  billingAddressId: "",
  paymentMethod: "instapay",
  couponCode: "",
  notes: "",
  isGift: false,
  giftMessage: "",
};
