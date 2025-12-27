import { z } from "zod";

export const addressTypeEnum = z.enum(["shipping", "billing", "both"]);

export const addressSchema = z
  .object({
    id: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    addressType: addressTypeEnum.default("both"),
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(4, "Full name must be at least 4 characters")
      .max(100, "Full name must be less than 100 characters")
      .refine(
        (val) => {
          // Count only letters (a-z, A-Z, and Arabic/Unicode letters)
          const letterCount = (val.match(/[\p{L}]/gu) || []).length;
          return letterCount >= 4;
        },
        {
          message: "Full name must contain at least 4 letters",
        }
      ),

    phone: z
      .string()
      .min(1, "Phone number is required")
      .regex(
        /^(?:\+20|20|0)?1[0125][0-9]{8}$/,
        "Please enter a valid Egyptian mobile number"
      ),

    company: z.string().optional(),

    addressLine1: z
      .string()
      .min(1, "Address line 1 is required")
      .min(5, "Address line 1 must be at least 5 characters")
      .max(200, "Address line 1 must be less than 200 characters"),

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

    country: z.string().default("Egypt"),

    isDefault: z.boolean().default(false),
    isBusinessAddress: z.boolean().default(false),

    deliveryInstructions: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 5, {
        message: "Delivery instructions must be at least 5 characters",
      }),

    latitude: z.number().optional(),
    longitude: z.number().optional(),
  })
  .refine(
    (data) => {
      // If it's a business address, company is required
      if (
        data.isBusinessAddress &&
        (!data.company || data.company.trim().length < 2)
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Company name is required for business addresses and must be at least 2 characters",
      path: ["company"],
    }
  );

export type AddressData = z.infer<typeof addressSchema>;

export const addressDefaults: Partial<AddressData> = {
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
  latitude: undefined,
  longitude: undefined,
};

// Common countries for the select
export const countries = [
  { value: "Egypt", label: "Egypt" },
  { value: "Saudi Arabia", label: "Saudi Arabia" },
  { value: "United Arab Emirates", label: "United Arab Emirates" },
  { value: "Kuwait", label: "Kuwait" },
  { value: "Qatar", label: "Qatar" },
  { value: "Bahrain", label: "Bahrain" },
  { value: "Oman", label: "Oman" },
  { value: "Jordan", label: "Jordan" },
  { value: "Lebanon", label: "Lebanon" },
  { value: "United States", label: "United States" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Canada", label: "Canada" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Italy", label: "Italy" },
  { value: "Spain", label: "Spain" },
  { value: "Australia", label: "Australia" },
  { value: "Japan", label: "Japan" },
  { value: "China", label: "China" },
  { value: "India", label: "India" },
];

export const addressTypeOptions = [
  { value: "shipping", label: "Shipping Address" },
  { value: "billing", label: "Billing Address" },
  { value: "both", label: "Both Shipping & Billing" },
];
