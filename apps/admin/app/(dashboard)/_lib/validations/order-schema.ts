import * as z from "zod";

export const orderSchema = z.object({
  orderNumber: z
    .string()
    .min(1, "Order number is required")
    .max(50, "Order number must be less than 50 characters"),
  userId: z.string().uuid("User ID must be a valid UUID"),
  subtotal: z
    .number()
    .min(0, "Subtotal must be a positive number")
    .max(1000000, "Subtotal must be less than 1,000,000"),
  shippingCost: z
    .number()
    .min(0, "Shipping cost must be a positive number")
    .max(10000, "Shipping cost must be less than 10,000")
    .default(0),
  tax: z
    .number()
    .min(0, "Tax must be a positive number")
    .max(200000, "Tax must be less than 200,000")
    .default(0),
  discountAmount: z
    .number()
    .min(0, "Discount amount must be a positive number")
    .max(1000000, "Discount amount must be less than 1,000,000")
    .default(0),
  giftWrapCost: z
    .number()
    .min(0, "Gift wrap cost must be a positive number")
    .max(1000, "Gift wrap cost must be less than 1,000")
    .default(0),
  totalAmount: z
    .number()
    .min(0, "Total amount must be a positive number")
    .max(1000000, "Total amount must be less than 1,000,000"),
  currency: z.string().default("USD"),
  status: z
    .enum([
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
    ])
    .default("pending"),
  paymentStatus: z
    .enum([
      "pending",
      "authorized",
      "paid",
      "failed",
      "refunded",
      "partially_refunded",
    ])
    .default("pending"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  shippingAddressId: z
    .string()
    .uuid("Shipping address ID must be a valid UUID")
    .optional(),
  billingAddressId: z
    .string()
    .uuid("Billing address ID must be a valid UUID")
    .optional(),
  isGift: z.boolean().default(false),
  giftMessage: z.string().max(500).optional(),
  couponCode: z.string().max(50).optional(),
  notes: z.string().max(1000).optional(),
  isBusinessOrder: z.boolean().default(false),
  customerIp: z.string().max(50).optional(),
  customerUserAgent: z.string().max(500).optional(),
  referralSource: z.string().max(100).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const orderItemSchema = z.object({
  orderId: z.string().uuid("Order ID must be a valid UUID"),
  productId: z.string().uuid("Product ID must be a valid UUID"),
  variantId: z.string().uuid("Variant ID must be a valid UUID").optional(),
  sellerId: z.string().uuid("Seller ID must be a valid UUID"),
  listingId: z.string().uuid("Listing ID must be a valid UUID").optional(),
  sku: z.string().min(1, "SKU is required"),
  productName: z.string().min(1, "Product name is required"),
  variantName: z.string().optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").default(1),
  price: z
    .number()
    .min(0, "Price must be a positive number")
    .max(1000000, "Price must be less than 1,000,000"),
  subtotal: z
    .number()
    .min(0, "Subtotal must be a positive number")
    .max(1000000, "Subtotal must be less than 1,000,000"),
  tax: z
    .number()
    .min(0, "Tax must be a positive number")
    .max(200000, "Tax must be less than 200,000")
    .default(0),
  shippingCost: z
    .number()
    .min(0, "Shipping cost must be a positive number")
    .max(10000, "Shipping cost must be less than 10,000")
    .default(0),
  discountAmount: z
    .number()
    .min(0, "Discount amount must be a positive number")
    .max(1000000, "Discount amount must be less than 1,000,000")
    .default(0),
  total: z
    .number()
    .min(0, "Total must be a positive number")
    .max(1000000, "Total must be less than 1,000,000"),
  commissionAmount: z
    .number()
    .min(0, "Commission amount must be a positive number"),
  commissionRate: z
    .number()
    .min(0, "Commission rate must be a positive number")
    .max(100, "Commission rate must be less than or equal to 100"),
  sellerEarning: z.number().min(0, "Seller earning must be a positive number"),
  currency: z.string().default("USD"),
  condition: z
    .enum([
      "new",
      "renewed",
      "refurbished",
      "used_like_new",
      "used_very_good",
      "used_good",
      "used_acceptable",
    ])
    .default("new"),
  fulfillmentType: z
    .enum(["seller_fulfilled", "platform_fulfilled", "fba", "digital"])
    .default("seller_fulfilled"),
  status: z
    .enum([
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
    ])
    .default("pending"),
  isReviewed: z.boolean().default(false),
  isReturned: z.boolean().default(false),
  isRefunded: z.boolean().default(false),
  refundAmount: z
    .number()
    .min(0, "Refund amount must be a positive number")
    .optional(),
  refundReason: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});
