import { z } from "zod";

const emptyable = () => z.string().trim().or(z.literal("")).default("");

export const sellerProfileSchema = z.object({
  businessName: z.string().trim().min(1, "seller.businessNameRequired"),
  displayName: z.string().trim().min(1, "seller.displayNameRequired"),
  description: emptyable(),
  logoUrl: emptyable(),
  bannerUrl: emptyable(),
  supportEmail: z.string().email("invalidEmail").or(z.literal("")).default(""),
  supportPhone: z
    .string()
    .regex(/^[+()\d\s-]*$/, "seller.invalidPhone")
    .or(z.literal(""))
    .default(""),
  returnPolicy: emptyable(),
  shippingPolicy: emptyable(),
});

export type SellerProfileForm = z.infer<typeof sellerProfileSchema>;
