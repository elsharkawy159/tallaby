import { z } from "zod";

const money = (label: string) =>
  z
    .number({ message: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(10_000_000, `${label} is too large`);

export const orderPricingItemSchema = z.object({
  id: z.string().uuid(),
  price: money("Unit price"),
});

export const orderPricingSchema = z.object({
  items: z.array(orderPricingItemSchema),
  shippingCost: money("Shipping"),
  tax: money("Tax"),
  discountAmount: money("Discount"),
  /**
   * Final total typed by the admin. Left null, the total is derived from the
   * lines above; set, it is stored verbatim so an agreed round figure survives
   * the arithmetic.
   */
  totalAmount: money("Total").nullable().optional(),
  notes: z.string().max(2000, "Notes are too long").optional(),
});

export type OrderPricingFormData = z.infer<typeof orderPricingSchema>;
export type OrderPricingItem = z.infer<typeof orderPricingItemSchema>;
