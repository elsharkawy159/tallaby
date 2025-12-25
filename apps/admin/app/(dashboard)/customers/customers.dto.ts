import { z } from "zod";

export const getAllCustomersParamsSchema = z.object({
  role: z.string().optional(),
  isVerified: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  search: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type GetAllCustomersParams = z.infer<typeof getAllCustomersParamsSchema>;

export const updateCustomerStatusSchema = z.object({
  customerId: z.string().uuid(),
  updates: z.object({
    isVerified: z.boolean().optional(),
    isSuspended: z.boolean().optional(),
    role: z.string().optional(),
  }),
});

export type UpdateCustomerStatusInput = z.infer<
  typeof updateCustomerStatusSchema
>;
