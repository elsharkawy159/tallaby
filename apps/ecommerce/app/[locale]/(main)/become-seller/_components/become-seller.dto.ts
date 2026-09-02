import { z } from "zod";
import { PRODUCT_CATEGORIES, EXPERIENCE_OPTIONS } from "./become-seller.types";

// Seller application form schema with required and optional fields
export const sellerApplicationSchema = z.object({
  // Required for businessName, display_name, slug generation
  businessName: z
    .string()
    .min(1, "Business name is required")
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters"),

  // Required for business_type
  businessType: z.string().min(1, "Business type is required"),

  // Optional store description
  description: z
    .string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),

  // Optional logo URL
  logoUrl: z
    .union([z.string().url("Please provide a valid logo URL"), z.literal("")])
    .optional(),

  // Required for legal_address (JSONB)
  legalAddress: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State/Province is required"),
    country: z.string().default("EG"),
    postalCode: z.string().optional(),
  }),

  // Required for support_email
  supportEmail: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),

  // Optional support phone
  supportPhone: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .optional(),

  // Optional registration number

  // Terms acceptance
  // acceptTerms: z.boolean().refine((val) => val === true, {
  //   message: "You must accept the terms and conditions to continue",
  // }),
});

// Infer the TypeScript type from the schema
export type SellerApplicationFormData = z.infer<typeof sellerApplicationSchema>;

// Default form values
export const sellerApplicationDefaults: Partial<SellerApplicationFormData> = {
  businessName: "",
  businessType: undefined,
  description: "",
  logoUrl: "",
  supportEmail: "",
  supportPhone: "",
  legalAddress: {
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "EG",
  },
};

// Database insertion schema (for Drizzle)
export const createSellerSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  businessName: z.string().min(1),
  displayName: z.string().min(1),
  slug: z.string().min(1),
  businessType: z.string().min(1),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  legalAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  supportEmail: z.string().email(),
  supportPhone: z.string().optional(),
});

export type CreateSellerData = z.infer<typeof createSellerSchema>;
