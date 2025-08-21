import { z } from "zod";

export const sellerActionSchema = z.object({
  sellerId: z.string().uuid("Seller ID must be a valid UUID"),
  action: z.enum(["approve", "suspend", "reactivate", "reject"], {
    required_error: "Action is required",
  }),
  reason: z.string().optional(),
});

export const sellerFiltersSchema = z.object({
  status: z.enum(["pending", "approved", "suspended", "restricted"]).optional(),
  businessType: z.string().optional(),
  isVerified: z.boolean().optional(),
  search: z.string().optional(),
  dateRange: z
    .object({
      from: z.date(),
      to: z.date(),
    })
    .optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

export const sellerUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "suspended", "restricted"]).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  isVerified: z.boolean().optional(),
  approvedCategories: z.array(z.string()).optional(),
  sellerLevel: z.string().optional(),
});

export type SellerActionData = z.infer<typeof sellerActionSchema>;
export type SellerFiltersData = z.infer<typeof sellerFiltersSchema>;
export type SellerUpdateData = z.infer<typeof sellerUpdateSchema>;
