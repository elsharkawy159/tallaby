import { z } from "zod";

export const addressFormSchema = z.object({
  addressType: z.enum(["shipping", "billing", "both"], {
    required_error: "Please select an address type",
  }),
  fullName: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),

  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number"),

  company: z.string().optional(),

  addressLine1: z
    .string()
    .min(1, "Address line 1 is required")
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must be less than 200 characters"),

  addressLine2: z.string().optional(),

  city: z
    .string()
    .min(1, "City is required")
    .min(2, "City must be at least 2 characters")
    .max(100, "City must be less than 100 characters"),

  state: z
    .string()
    .min(1, "State/Province is required")
    .min(2, "State/Province must be at least 2 characters")
    .max(100, "State/Province must be less than 100 characters"),

  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .min(3, "Postal code must be at least 3 characters")
    .max(20, "Postal code must be less than 20 characters"),

  country: z
    .string()
    .min(1, "Country is required")
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country must be less than 100 characters"),

  isDefault: z.boolean().default(false),

  isBusinessAddress: z.boolean().default(false),

  deliveryInstructions: z.string().optional(),
});

// Export the inferred type
export type AddressFormData = z.infer<typeof addressFormSchema>;

// Default values (must match schema structure)
export const addressFormDefaults: Partial<AddressFormData> = {
  addressType: "both",
  fullName: "",
  phone: "",
  company: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Egypt", // Default country for the platform
  isDefault: false,
  isBusinessAddress: false,
  deliveryInstructions: "",
};
