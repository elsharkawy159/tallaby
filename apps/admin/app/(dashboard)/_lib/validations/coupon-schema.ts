import { z } from "zod";

/**
 * Discount types an admin can create for a platform-wide coupon.
 * `buy_x_get_y` is left out: it needs per-product rules (applicable_to), which
 * a coupon that applies to every product on Tallaby does not have.
 */
export const COUPON_DISCOUNT_TYPES = [
  "percentage",
  "fixed_amount",
  "free_shipping",
] as const;

export type CouponDiscountType = (typeof COUPON_DISCOUNT_TYPES)[number];

/** Empty input -> "not set"; react-hook-form number inputs emit "" when cleared. */
const optionalAmount = z.union([z.literal(""), z.number().positive("Must be greater than 0")]);
const optionalCount = z.union([
  z.literal(""),
  z.number().int("Must be a whole number").positive("Must be at least 1"),
]);

/** Client form values (dates are `datetime-local` strings, in the browser's time zone). */
export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "At least 3 characters")
      .max(32, "At most 32 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only"),
    name: z.string().trim().min(2, "Name is required").max(100),
    description: z.string().trim().max(500),
    discountType: z.enum(COUPON_DISCOUNT_TYPES),
    discountValue: z.union([z.literal(""), z.number().min(0)]),
    minimumPurchase: optionalAmount,
    maximumDiscount: optionalAmount,
    usageLimit: optionalCount,
    perUserLimit: optionalCount,
    isOneTimeUse: z.boolean(),
    isActive: z.boolean(),
    startsAt: z.string().min(1, "Start date is required"),
    expiresAt: z.string().min(1, "Expiry date is required"),
  })
  .superRefine((values, ctx) => {
    if (values.discountType !== "free_shipping") {
      const value = values.discountValue;
      if (value === "" || value <= 0) {
        ctx.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "Enter a discount greater than 0",
        });
      } else if (values.discountType === "percentage" && value > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["discountValue"],
          message: "A percentage can't exceed 100",
        });
      }
    }
    if (
      values.startsAt &&
      values.expiresAt &&
      new Date(values.expiresAt) <= new Date(values.startsAt)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Must be after the start date",
      });
    }
  });

export type CouponFormValues = z.infer<typeof couponFormSchema>;

/** Server action payload: normalized numbers/nulls and ISO timestamps. */
export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3)
      .max(32)
      .regex(/^[A-Za-z0-9_-]+$/)
      .transform((code) => code.toUpperCase()),
    name: z.string().trim().min(2).max(100),
    description: z.string().trim().max(500).nullable(),
    discountType: z.enum(COUPON_DISCOUNT_TYPES),
    discountValue: z.number().min(0),
    minimumPurchase: z.number().positive().nullable(),
    maximumDiscount: z.number().positive().nullable(),
    usageLimit: z.number().int().positive().nullable(),
    perUserLimit: z.number().int().positive().nullable(),
    isOneTimeUse: z.boolean(),
    isActive: z.boolean(),
    startsAt: z.iso.datetime({ offset: true }),
    expiresAt: z.iso.datetime({ offset: true }),
  })
  .refine((input) => new Date(input.expiresAt) > new Date(input.startsAt), {
    path: ["expiresAt"],
    message: "Expiry must be after the start date",
  })
  .refine(
    (input) =>
      input.discountType === "free_shipping" ||
      (input.discountValue > 0 &&
        (input.discountType !== "percentage" || input.discountValue <= 100)),
    { path: ["discountValue"], message: "Invalid discount value" }
  );

export type CouponInput = z.input<typeof couponInputSchema>;

/** Form values -> server payload. */
export function toCouponInput(values: CouponFormValues): CouponInput {
  const orNull = <T,>(value: T | "") => (value === "" ? null : value);
  const isFreeShipping = values.discountType === "free_shipping";
  return {
    code: values.code,
    name: values.name,
    description: values.description.trim() || null,
    discountType: values.discountType,
    discountValue: isFreeShipping ? 0 : Number(values.discountValue || 0),
    minimumPurchase: orNull(values.minimumPurchase),
    // A cap only makes sense on a percentage discount.
    maximumDiscount:
      values.discountType === "percentage" ? orNull(values.maximumDiscount) : null,
    usageLimit: orNull(values.usageLimit),
    perUserLimit: values.isOneTimeUse ? 1 : orNull(values.perUserLimit),
    isOneTimeUse: values.isOneTimeUse,
    isActive: values.isActive,
    startsAt: new Date(values.startsAt).toISOString(),
    expiresAt: new Date(values.expiresAt).toISOString(),
  };
}
