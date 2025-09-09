import { z } from "zod";

// Admin Authentication Schemas
export const adminSignInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const adminSignUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    adminCode: z.string().min(1, "Admin code is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const adminResetPasswordSchema = z.object({
  resetEmail: z.string().email("Please enter a valid email address"),
});

// Admin Profile Schema
export const adminProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),

  email: z.string().email("Please enter a valid email address"),

  role: z.enum(["super_admin", "admin", "moderator"], {
    required_error: "Please select a valid role",
  }),

  permissions: z.array(z.string()).optional(),

  department: z.string().optional(),

  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s-()]+$/.test(val), {
      message: "Please enter a valid phone number",
    }),

  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

// Admin Settings Schema
export const adminSettingsSchema = z.object({
  siteName: z
    .string()
    .min(1, "Site name is required")
    .max(100, "Site name must be less than 100 characters"),

  siteDescription: z
    .string()
    .max(500, "Site description must be less than 500 characters")
    .optional(),

  contactEmail: z.string().email("Please enter a valid contact email"),

  supportEmail: z.string().email("Please enter a valid support email"),

  defaultCurrency: z
    .string()
    .min(3)
    .max(3, "Currency code must be 3 characters"),

  timezone: z.string().min(1, "Timezone is required"),

  maintenanceMode: z.boolean().default(false),

  allowRegistration: z.boolean().default(true),

  requireEmailVerification: z.boolean().default(true),

  maxFileUploadSize: z
    .number()
    .min(1)
    .max(100, "Max file size must be between 1-100MB"),

  sessionTimeout: z
    .number()
    .min(15)
    .max(480, "Session timeout must be between 15-480 minutes"),
});

// Order Management Schema
export const adminOrderUpdateSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  status: z.enum(
    [
      "pending",
      "payment_processing",
      "confirmed",
      "shipping_soon",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "refund_requested",
      "refunded",
      "returned",
    ],
    {
      required_error: "Please select a valid order status",
    }
  ),
  paymentStatus: z
    .enum(["pending", "paid", "failed", "refunded", "partially_refunded"], {
      required_error: "Please select a valid payment status",
    })
    .optional(),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

// Product Management Schema
export const adminProductUpdateSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  status: z.enum(["active", "inactive", "pending", "rejected"], {
    required_error: "Please select a valid product status",
  }),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

// Vendor Management Schema
export const adminVendorUpdateSchema = z.object({
  vendorId: z.string().uuid("Invalid vendor ID"),
  status: z.enum(["pending", "approved", "suspended", "rejected"], {
    required_error: "Please select a valid vendor status",
  }),
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

// Bulk Operations Schema
export const adminBulkOperationSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, "Select at least one item"),
  operation: z.enum(["activate", "deactivate", "delete", "export"], {
    required_error: "Please select an operation",
  }),
});

// Search and Filter Schemas
export const adminSearchSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Analytics Schema
export const adminAnalyticsSchema = z.object({
  period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
  metric: z
    .enum(["orders", "revenue", "users", "products", "vendors"])
    .default("orders"),
});

// Type exports
export type AdminSignInFormData = z.infer<typeof adminSignInSchema>;
export type AdminSignUpFormData = z.infer<typeof adminSignUpSchema>;
export type AdminResetPasswordFormData = z.infer<
  typeof adminResetPasswordSchema
>;
export type AdminProfileData = z.infer<typeof adminProfileSchema>;
export type AdminSettingsData = z.infer<typeof adminSettingsSchema>;
export type AdminOrderUpdateData = z.infer<typeof adminOrderUpdateSchema>;
export type AdminProductUpdateData = z.infer<typeof adminProductUpdateSchema>;
export type AdminVendorUpdateData = z.infer<typeof adminVendorUpdateSchema>;
export type AdminBulkOperationData = z.infer<typeof adminBulkOperationSchema>;
export type AdminSearchData = z.infer<typeof adminSearchSchema>;
export type AdminAnalyticsData = z.infer<typeof adminAnalyticsSchema>;

// Default values
export const adminProfileDefaults: Partial<AdminProfileData> = {
  fullName: "",
  email: "",
  role: "admin",
  permissions: [],
  department: "",
  phone: "",
  notes: "",
};

export const adminSettingsDefaults: Partial<AdminSettingsData> = {
  siteName: "",
  siteDescription: "",
  contactEmail: "",
  supportEmail: "",
  defaultCurrency: "USD",
  timezone: "UTC",
  maintenanceMode: false,
  allowRegistration: true,
  requireEmailVerification: true,
  maxFileUploadSize: 10,
  sessionTimeout: 60,
};
