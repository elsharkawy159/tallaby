import { z } from "zod";
import { PRODUCT_CATEGORIES, EXPERIENCE_OPTIONS } from "./become-seller.types";

// Simplified seller application form schema - ONLY REQUIRED FIELDS
export const sellerApplicationSchema = z.object({
  // Required for business_name, display_name, slug generation
  businessName: z
    .string()
    .min(1, "Business name is required")
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters"),

  // Required for business_type
  businessType: z.enum(
    ["individual", "company", "partnership", "corporation"],
    {
      required_error: "Please select your business type",
    }
  ),

  // Required for support_email
  supportEmail: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),

  // Required for legal_address (JSONB)
  addressLine1: z
    .string()
    .min(1, "Address line 1 is required")
    .max(255, "Address line 1 must be less than 255 characters"),

  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters"),

  state: z
    .string()
    .min(1, "State/Province is required")
    .max(100, "State/Province must be less than 100 characters"),

  postalCode: z
    .string()
    .min(1, "Postal/ZIP code is required")
    .max(20, "Postal/ZIP code must be less than 20 characters"),

  country: z
    .string()
    .min(1, "Country is required")
    .max(100, "Country must be less than 100 characters"),

  // Terms acceptance
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions to continue",
  }),
});

// Infer the TypeScript type from the schema
export type SellerApplicationFormData = z.infer<typeof sellerApplicationSchema>;

// Default form values - SIMPLIFIED
export const sellerApplicationDefaults: Partial<SellerApplicationFormData> = {
  businessName: "",
  businessType: undefined,
  supportEmail: "",
  addressLine1: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  acceptTerms: false,
};

// Database insertion schema (for Drizzle) - SIMPLIFIED
export const createSellerSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  businessName: z.string().min(1),
  displayName: z.string().min(1),
  slug: z.string().min(1),
  businessType: z.string().min(1),
  legalAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),
  supportEmail: z.string().email(),
});

export type CreateSellerData = z.infer<typeof createSellerSchema>;
