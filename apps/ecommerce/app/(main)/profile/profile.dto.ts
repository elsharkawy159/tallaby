import { z } from "zod";

// Profile form validation schema
export const profileFormSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s-']+$/,
      "First name can only contain letters, spaces, hyphens, and apostrophes"
    ),

  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .regex(
      /^[a-zA-Z\s-']+$/,
      "Last name can only contain letters, spaces, hyphens, and apostrophes"
    ),

  phone: z
    .string()
    .refine((val) => !val || /^\+?[\d\s-()]+$/.test(val), {
      message: "Please enter a valid phone number",
    })
    .refine((val) => !val || val.length >= 10, {
      message: "Phone number must be at least 10 digits",
    }),

  timezone: z
    .string()
    .min(1, "Timezone is required")
    .max(50, "Invalid timezone"),

  preferredLanguage: z
    .string()
    .min(1, "Language preference is required")
    .max(5, "Invalid language code"),

  defaultCurrency: z
    .string()
    .min(1, "Currency is required")
    .length(3, "Currency must be a 3-letter code"),

  receiveMarketingEmails: z.boolean(),
});

// Address form validation schema
export const addressFormSchema = z.object({
  addressType: z.enum(["billing", "shipping", "both"], {
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
    .regex(/^\+?[\d\s-()]+$/, "Please enter a valid phone number")
    .min(10, "Phone number must be at least 10 digits"),

  company: z
    .string()
    .max(100, "Company name must be less than 100 characters")
    .optional(),

  addressLine1: z
    .string()
    .min(1, "Address line 1 is required")
    .min(5, "Address must be at least 5 characters")
    .max(100, "Address must be less than 100 characters"),

  addressLine2: z
    .string()
    .max(100, "Address line 2 must be less than 100 characters")
    .optional(),

  city: z
    .string()
    .min(1, "City is required")
    .min(2, "City name must be at least 2 characters")
    .max(50, "City name must be less than 50 characters"),

  state: z
    .string()
    .min(1, "State/Province is required")
    .min(2, "State name must be at least 2 characters")
    .max(50, "State name must be less than 50 characters"),

  postalCode: z
    .string()
    .min(1, "Postal code is required")
    .min(3, "Postal code must be at least 3 characters")
    .max(20, "Postal code must be less than 20 characters"),

  country: z
    .string()
    .min(1, "Country is required")
    .min(2, "Country must be at least 2 characters")
    .max(50, "Country must be less than 50 characters"),

  isDefault: z.boolean(),

  isBusinessAddress: z.boolean(),

  deliveryInstructions: z
    .string()
    .max(500, "Delivery instructions must be less than 500 characters")
    .optional(),

  accessCode: z
    .string()
    .max(20, "Access code must be less than 20 characters")
    .optional(),
});

// Security/Password form validation schema
export const securityFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),

    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be less than 128 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),

    confirmPassword: z.string().min(1, "Please confirm your password"),

    hasTwoFactorAuth: z.boolean(),

    twoFactorMethod: z.string().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.hasTwoFactorAuth && !data.twoFactorMethod) {
        return false;
      }
      return true;
    },
    {
      message: "Please select a two-factor authentication method",
      path: ["twoFactorMethod"],
    }
  );

// Wishlist form validation schema
export const wishlistFormSchema = z.object({
  name: z
    .string()
    .min(1, "Wishlist name is required")
    .min(2, "Wishlist name must be at least 2 characters")
    .max(100, "Wishlist name must be less than 100 characters"),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),

  isPublic: z.boolean(),
});

// Export inferred types
export type ProfileFormData = z.infer<typeof profileFormSchema>;
export type AddressFormData = z.infer<typeof addressFormSchema>;
export type SecurityFormData = z.infer<typeof securityFormSchema>;
export type WishlistFormData = z.infer<typeof wishlistFormSchema>;

// Default values for forms
export const profileFormDefaults: Partial<ProfileFormData> = {
  firstName: "",
  lastName: "",
  phone: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  preferredLanguage: "en",
  defaultCurrency: "EGP",
  receiveMarketingEmails: true,
};

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
  country: "Egypt",
  isDefault: false,
  isBusinessAddress: false,
  deliveryInstructions: "",
  accessCode: "",
};

export const securityFormDefaults: Partial<SecurityFormData> = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  hasTwoFactorAuth: false,
  twoFactorMethod: "",
};

export const wishlistFormDefaults: Partial<WishlistFormData> = {
  name: "",
  description: "",
  isPublic: false,
};
