import type {
  CancelTallabyPayPayoutError,
  RequestTallabyPayPayoutError,
  SubmitTallabyPayKycError,
} from "@workspace/lib/tallaby-pay/server";

/** Errors every Earnings action may return besides its own. */
type CommonError = "rateLimited" | "readOnly" | "notFound" | "suspended" | "generic";

export type RequestWithdrawalError = RequestTallabyPayPayoutError | CommonError;
export type RequestWithdrawalResult =
  | { success: true; payoutId: string; amount: string }
  | { success: false; error: RequestWithdrawalError };

export type CancelWithdrawalError = CancelTallabyPayPayoutError | CommonError;
export type CancelWithdrawalResult = { success: true } | { success: false; error: CancelWithdrawalError };

export type SubmitKycError = SubmitTallabyPayKycError | CommonError;
export type SubmitKycResult = { success: true } | { success: false; error: SubmitKycError };
