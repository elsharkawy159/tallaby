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

/** Form values → the strict detail schema (empty strings omitted). */
export function toDetails(kind: "wallet" | "instapay", v: PaymentDetailsFormValues) {
  if (kind === "wallet") return { holderName: v.holderName.trim(), phone: v.phone.trim() };
  const out: Record<string, string> = { holderName: v.holderName.trim() };
  for (const key of ["phone", "ipa", "iban", "paymentLink"] as const) {
    if (v[key].trim()) out[key] = v[key].trim();
  }
  return out;
}
