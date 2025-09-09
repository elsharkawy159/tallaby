import { z } from "zod";

// Authentication Schemas
export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export const orderUpdateSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  updates: z.object({
    status: z.enum([
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ]),
    notes: z.string().optional(),
  }),
});
export const signUpSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  resetEmail: z.string().email("Please enter a valid email address"),
});

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Vendor Profile Schema
export const vendorProfileSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters"),

  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be less than 50 characters"),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),

  businessType: z.string().min(1, "Business type is required"),

  registrationNumber: z.string().optional(),

  supportEmail: z.string().email("Please enter a valid email address"),

  supportPhone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[\d\s-()]+$/.test(val), {
      message: "Please enter a valid phone number",
    }),

  returnPolicy: z
    .string()
    .max(1000, "Return policy must be less than 1000 characters")
    .optional(),

  shippingPolicy: z
    .string()
    .max(1000, "Shipping policy must be less than 1000 characters")
    .optional(),

  legalAddress: z.object({
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    country: z.string().min(1, "Country is required"),
  }),
});

export type VendorProfileData = z.infer<typeof vendorProfileSchema>;

export const vendorProfileDefaults: Partial<VendorProfileData> = {
  businessName: "",
  displayName: "",
  description: "",
  businessType: "",
  registrationNumber: "",
  supportEmail: "",
  supportPhone: "",
  returnPolicy: "",
  shippingPolicy: "",
  legalAddress: {
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  },
};

// Product Creation Schema
export const productCreationSchema = z.object({
  title: z
    .string()
    .min(3, "Product title must be at least 3 characters")
    .max(200, "Product title must be less than 200 characters"),

  description: z
    .string()
    .max(2000, "Description must be less than 2000 characters")
    .optional(),

  categoryId: z.string().uuid("Please select a valid category"),

  brandId: z.string().uuid("Please select a valid brand").optional(),

  listPrice: z
    .string()
    .optional()
    .refine((val) => !val || parseFloat(val) >= 0, {
      message: "List price must be a positive number",
    }),

  basePrice: z.string().refine((val) => parseFloat(val) > 0, {
    message: "Base price must be greater than 0",
  }),

  sku: z
    .string()
    .min(1, "SKU is required")
    .max(50, "SKU must be less than 50 characters"),

  condition: z.enum(
    [
      "new",
      "renewed",
      "refurbished",
      "used_like_new",
      "used_very_good",
      "used_good",
      "used_acceptable",
    ],
    {
      required_error: "Please select a product condition",
    }
  ),

  conditionDescription: z
    .string()
    .max(200, "Condition description must be less than 200 characters")
    .optional(),

  price: z.string().refine((val) => parseFloat(val) > 0, {
    message: "Price must be greater than 0",
  }),

  salePrice: z
    .string()
    .optional()
    .refine((val) => !val || parseFloat(val) > 0, {
      message: "Sale price must be greater than 0",
    }),

  quantity: z.number().min(0, "Quantity must be 0 or greater"),

  fulfillmentType: z.enum(
    ["seller_fulfilled", "platform_fulfilled", "fba", "digital"],
    {
      required_error: "Please select a fulfillment type",
    }
  ),

  handlingTime: z
    .number()
    .min(1, "Handling time must be at least 1 day")
    .max(30, "Handling time cannot exceed 30 days"),

  restockDate: z.string().optional(),

  maxOrderQuantity: z
    .number()
    .min(1, "Max order quantity must be at least 1")
    .optional(),

  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),

  images: z
    .array(z.string().url("Please provide valid image URLs"))
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images allowed"),
});

export type ProductCreationData = z.infer<typeof productCreationSchema>;

export const productCreationDefaults: Partial<ProductCreationData> = {
  title: "",
  description: "",
  categoryId: "",
  brandId: "",
  listPrice: "",
  basePrice: "",
  sku: "",
  condition: "new",
  conditionDescription: "",
  price: "",
  salePrice: "",
  quantity: 0,
  fulfillmentType: "seller_fulfilled",
  handlingTime: 1,
  restockDate: "",
  maxOrderQuantity: undefined,
  notes: "",
  images: [],
};

// Product Update Schema (all fields optional)
export const productUpdateSchema = productCreationSchema.partial();

export type ProductUpdateData = z.infer<typeof productUpdateSchema>;

// Order Status Update Schema
export const orderStatusUpdateSchema = z.object({
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
  notes: z
    .string()
    .max(500, "Notes must be less than 500 characters")
    .optional(),
});

export type OrderStatusUpdateData = z.infer<typeof orderStatusUpdateSchema>;

// Product Search Schema
export const productSearchSchema = z.object({
  search: z.string().optional(),
  category: z.string().uuid().optional(),
  brand: z.string().uuid().optional(),
  status: z.enum(["all", "active", "inactive"]).default("all"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type ProductSearchData = z.infer<typeof productSearchSchema>;

// Order Search Schema
export const orderSearchSchema = z.object({
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export type OrderSearchData = z.infer<typeof orderSearchSchema>;

// Analytics Period Schema
export const analyticsPeriodSchema = z.object({
  period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
});

export type AnalyticsPeriodData = z.infer<typeof analyticsPeriodSchema>;

// Bulk Product Operations Schema
export const bulkProductOperationSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, "Select at least one product"),
  operation: z.enum(["activate", "deactivate", "delete"], {
    required_error: "Please select an operation",
  }),
});

export type BulkProductOperationData = z.infer<
  typeof bulkProductOperationSchema
>;

// Product Import Schema
export const productImportSchema = z.object({
  file: z.instanceof(File, { message: "Please select a file to upload" }),
  updateExisting: z.boolean().default(false),
  categoryMapping: z.record(z.string(), z.string()).optional(),
});

export type ProductImportData = z.infer<typeof productImportSchema>;
