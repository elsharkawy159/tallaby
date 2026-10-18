import { z } from "zod";

/**
 * Business & account (PLAN.md P3-05). Store fields (display name, logo, banner,
 * description) moved to Store settings and are no longer sent from
 * here, so this autosave form can never overwrite them.
 */
export const sellerProfileSchema = z.object({
  businessName: z.string().trim().min(1, "seller.businessNameRequired"),
  supportEmail: z.string().email("invalidEmail").or(z.literal("")).default(""),
  supportPhone: z
    .string()
    .regex(/^[+()\d\s-]*$/, "seller.invalidPhone")
    .or(z.literal(""))
    .default(""),
});

export type SellerProfileForm = z.infer<typeof sellerProfileSchema>;
