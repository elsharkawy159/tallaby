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

const topUpStatuses = [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
] as const;

export const payoutRequestFiltersSchema = z.object({
  status: z.enum(payoutStatuses).optional(),
  search: z.string().trim().max(120).optional(),
});

export const topUpRequestFiltersSchema = z.object({
  status: z.enum(topUpStatuses).optional(),
  search: z.string().trim().max(120).optional(),
});

export const walletFiltersSchema = z.object({
  status: z.enum(["active", "frozen", "closed"]).optional(),
  search: z.string().trim().max(120).optional(),
});

export const payoutIdSchema = z.object({
  payoutRequestId: z.string().uuid(),
});

export const topUpIdSchema = z.object({
  topUpId: z.string().uuid(),
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

export const confirmTopUpSchema = topUpIdSchema.extend({
  /** Optional bank/InstaPay/Vodafone reference observed when verifying. */
  externalReference: z.string().trim().max(200).optional(),
});

export const rejectTopUpSchema = topUpIdSchema.extend({
  reason: z.string().trim().min(3).max(1000),
});

export const walletIdSchema = z.object({
  walletId: z.string().uuid(),
});

export type PayoutRequestFiltersInput = z.infer<
  typeof payoutRequestFiltersSchema
>;
export type TopUpRequestFiltersInput = z.infer<
  typeof topUpRequestFiltersSchema
>;
export type WalletFiltersInput = z.infer<typeof walletFiltersSchema>;
