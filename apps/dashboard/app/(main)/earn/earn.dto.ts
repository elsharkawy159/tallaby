import type { RequestPayoutError } from "@workspace/lib/referrals/server";

export type WithdrawActionError = RequestPayoutError | "rateLimited" | "generic";

export type WithdrawActionResult = { success: true; amount: string } | { success: false; error: WithdrawActionError };
