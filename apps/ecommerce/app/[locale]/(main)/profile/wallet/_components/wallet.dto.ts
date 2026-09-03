import { z } from "zod";

import {
  WALLET_PAYOUT_METHODS,
  WALLET_PAYOUT_MIN,
  WALLET_TOP_UP_MAX,
  WALLET_TOP_UP_MIN,
} from "./wallet.lib";

/**
 * Money entered by a user. Bounded and capped at two decimal places here, and
 * validated again server-side (and once more by toWalletAmount in
 * @workspace/db/wallet) — client validation is UX, never the control.
 */
const amountField = z
  .number({ message: "Enter a valid amount" })
  .finite()
  .refine((value) => Math.round(value * 100) === value * 100, {
    message: "Amount cannot have more than two decimal places",
  });

export const topUpFormSchema = z.object({
  amount: amountField
    .min(WALLET_TOP_UP_MIN, `Minimum top up is ${WALLET_TOP_UP_MIN} EGP`)
    .max(WALLET_TOP_UP_MAX, `Maximum top up is ${WALLET_TOP_UP_MAX} EGP`),
});

export const payoutFormSchema = z.object({
  amount: amountField.min(
    WALLET_PAYOUT_MIN,
    `Minimum payout is ${WALLET_PAYOUT_MIN} EGP`
  ),
  method: z.enum(WALLET_PAYOUT_METHODS),
  /** Free-form account reference: IBAN, InstaPay handle or wallet number. */
  accountName: z.string().trim().min(2).max(120),
  accountNumber: z.string().trim().min(4).max(64),
  notes: z.string().trim().max(500).optional(),
});

export const walletTransactionsPageSchema = z.object({
  limit: z.number().int().min(1).max(50),
  offset: z.number().int().min(0),
});

export const cancelPayoutRequestSchema = z.object({
  payoutRequestId: z.string().uuid(),
});

export type TopUpFormData = z.infer<typeof topUpFormSchema>;
export type PayoutFormData = z.infer<typeof payoutFormSchema>;

export const topUpFormDefaults: TopUpFormData = {
  amount: WALLET_TOP_UP_MIN,
};

export const payoutFormDefaults: PayoutFormData = {
  amount: WALLET_PAYOUT_MIN,
  method: "bank_transfer",
  accountName: "",
  accountNumber: "",
  notes: "",
};
