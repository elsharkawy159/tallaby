import { z } from "zod";

const emptyable = () => z.string().trim().or(z.literal("")).default("");

export const sellerProfileSchema = z.object({
  businessName: z.string().trim().min(1, "Business name is required"),
  displayName: z.string().trim().min(1, "Display name is required"),
  description: emptyable(),
  logoUrl: emptyable(),
  bannerUrl: emptyable(),
  supportEmail: z.string().email("Invalid email").or(z.literal("")).default(""),
  supportPhone: z
    .string()
    .regex(/^[+()\d\s-]*$/, "Invalid phone number")
    .or(z.literal(""))
    .default(""),
  returnPolicy: emptyable(),
  shippingPolicy: emptyable(),
});

export type SellerProfileForm = z.infer<typeof sellerProfileSchema>;
