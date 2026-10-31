import type { InstapayReceiveType } from "@workspace/lib/payments/store-methods";

/** Error keys live under `storePayments.errors`. */
export type StorePaymentsErrorKey =
  | "invalidDetails"
  | "lastMethod"
  | "notAvailable"
  | "readOnly"
  | "notFound"
  | "rateLimited"
  | "generic";

export type StorePaymentsResult<T> = { success: true; data: T } | { success: false; error: StorePaymentsErrorKey };

/** The details sheet's values as edited in the browser ("" = empty). */
export type PaymentDetailsFormValues = {
  holderName: string;
  phone: string;
  ipa: string;
  iban: string;
  paymentLink: string;
};

/**
 * Form values → the strict detail schema. InstaPay keeps only the identifier
 * picked in the "receive by" dropdown (owner, 2026-10-31), so the customer
 * sees exactly one way to pay.
 */
export function toDetails(kind: "wallet" | "instapay", v: PaymentDetailsFormValues, receiveBy: InstapayReceiveType = "ipa") {
  if (kind === "wallet") return { holderName: v.holderName.trim(), phone: v.phone.trim() };
  return { holderName: v.holderName.trim(), [receiveBy]: v[receiveBy].trim() };
}
