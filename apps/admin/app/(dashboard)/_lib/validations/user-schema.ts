import * as z from "zod";

export const userSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(100, "First name must be less than 100 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name must be less than 100 characters"),
  phone: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .optional(),
  role: z
    .enum(["customer", "seller", "admin", "support", "driver"])
    .default("customer"),
  avatar: z.string().url("Avatar must be a valid URL").optional(),
  isVerified: z.boolean().default(false),
  isSuspended: z.boolean().default(false),
  timezone: z.string().optional(),
  preferredLanguage: z.string().default("en"),
  defaultCurrency: z.string().default("USD"),
  receiveMarketingEmails: z.boolean().default(true),
  hasTwoFactorAuth: z.boolean().default(false),
  twoFactorMethod: z.string().optional(),
});

export const userAddressSchema = z.object({
  userId: z.string().uuid("User ID must be a valid UUID"),
  addressType: z.enum(["shipping", "billing", "both"]).default("both"),
  fullName: z
    .string()
    .min(1, "Full name is required")
    .max(255, "Full name must be less than 255 characters"),
  phone: z
    .string()
    .min(1, "Phone is required")
    .max(20, "Phone must be less than 20 characters"),
  company: z.string().max(255).optional(),
  addressLine1: z
    .string()
    .min(1, "Address line 1 is required")
    .max(255, "Address line 1 must be less than 255 characters"),
  addressLine2: z.string().max(255).optional(),
  city: z
    .string()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters"),
  state: z
    .string()
    .min(1, "State is required")
    .max(100, "State must be less than 100 characters"),
  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .max(20, "Postal code must be less than 20 characters"),
  country: z
    .string()
    .min(1, "Country is required")
    .max(100, "Country must be less than 100 characters"),
  isDefault: z.boolean().default(false),
  isBusinessAddress: z.boolean().default(false),
  deliveryInstructions: z.string().max(500).optional(),
  accessCode: z.string().max(50).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const sellerSchema = z.object({
  id: z.string().uuid("Seller ID must be a valid UUID"),
  businessName: z
    .string()
    .min(1, "Business name is required")
    .max(255, "Business name must be less than 255 characters"),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(255, "Display name must be less than 255 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(255, "Slug must be less than 255 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be in URL-friendly format"),
  description: z.string().optional(),
  logoUrl: z.string().url("Logo URL must be a valid URL").optional(),
  bannerUrl: z.string().url("Banner URL must be a valid URL").optional(),
  taxId: z.string().max(50).optional(),
  businessType: z
    .string()
    .min(1, "Business type is required")
    .max(50, "Business type must be less than 50 characters"),
  registrationNumber: z.string().max(50).optional(),
  legalAddress: z.object({
    addressLine1: z.string().min(1, "Address line 1 is required"),
    addressLine2: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
  status: z
    .enum(["pending", "approved", "suspended", "restricted"])
    .default("pending"),
  verificationDetails: z.record(z.string(), z.any()).optional(),
  returnPolicy: z.string().optional(),
  shippingPolicy: z.string().optional(),
  isVerified: z.boolean().default(false),
  approvedCategories: z.array(z.string()).optional(),
  supportEmail: z
    .string()
    .email("Support email must be a valid email address")
    .min(1, "Support email is required"),
  supportPhone: z.string().max(20).optional(),
  commissionRate: z
    .number()
    .min(0, "Commission rate must be a positive number")
    .max(100, "Commission rate must be less than or equal to 100")
    .default(15),
  feeStructure: z.record(z.string(), z.any()).optional(),
  taxInformation: z.record(z.string(), z.any()).optional(),
  paymentDetails: z.record(z.string(), z.any()).optional(),
  fulfillmentOptions: z.array(z.string()).optional(),
  payoutSchedule: z.string().default("biweekly"),
  stripeAccountId: z.string().optional(),
  sellerLevel: z.string().default("standard"),
});
