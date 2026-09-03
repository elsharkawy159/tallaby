import { z } from "zod";

const payoutStatuses = [
  "pending",
  "approved",
  "processing",
  "completed",
  "rejected",
  "cancelled",
  "failed",
] as const;

export const payoutRequestFiltersSchema = z.object({
  status: z.enum(payoutStatuses).optional(),
  search: z.string().trim().max(120).optional(),
});

export const walletFiltersSchema = z.object({
  status: z.enum(["active", "frozen", "closed"]).optional(),
  search: z.string().trim().max(120).optional(),
});

export const payoutIdSchema = z.object({
  payoutRequestId: z.string().uuid(),
});

export const approvePayoutSchema = payoutIdSchema.extend({
  adminNotes: z.string().trim().max(1000).optional(),
});

export const rejectPayoutSchema = payoutIdSchema.extend({
  rejectionReason: z.string().trim().min(3).max(1000),
});

export const completePayoutSchema = payoutIdSchema.extend({
  /** The bank/InstaPay reference for the transfer that was actually sent. */
  externalReference: z.string().trim().min(2).max(200),
  adminNotes: z.string().trim().max(1000).optional(),
});

export const walletIdSchema = z.object({
  walletId: z.string().uuid(),
});

export type PayoutRequestFiltersInput = z.infer<
  typeof payoutRequestFiltersSchema
>;
export type WalletFiltersInput = z.infer<typeof walletFiltersSchema>;
