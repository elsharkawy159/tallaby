import { z } from "zod";

export const checkoutFormSchema = z.object({
  shippingAddressId: z.string().min(1, "Shipping address is required"),
  billingAddressId: z.string().optional(),
  paymentMethod: z.string().min(1, "Payment method is required"),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  isGift: z.boolean().optional(),
  giftMessage: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

export const checkoutFormDefaults: Partial<CheckoutFormData> = {
  shippingAddressId: "",
  billingAddressId: "",
  paymentMethod: "cash_on_delivery", // Default to cash on delivery
  couponCode: "",
  notes: "",
  isGift: false,
  giftMessage: "",
};
