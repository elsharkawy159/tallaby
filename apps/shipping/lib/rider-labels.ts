import type { useTranslations } from "next-intl";

type TranslateFn = ReturnType<typeof useTranslations>;

export function translateShippingStatus(
  tStatus: TranslateFn,
  status: string
): string {
  return tStatus(status as "pending");
}

export function translateFailureReason(
  tReasons: TranslateFn,
  code: string
): string {
  return tReasons(code as "customer_unavailable");
}

export function translateCollectionMethod(
  tMethods: TranslateFn,
  method: string
): string {
  return tMethods(method as "cash");
}

export function translatePaymentStatus(
  tPayment: TranslateFn,
  status: string | null | undefined
): string {
  if (!status) return "—";
  return tPayment(status as "pending");
}

export function translatePaymentMethod(
  tMethod: TranslateFn,
  method: string | null | undefined
): string {
  if (!method) return "—";
  return tMethod(method as "cash_on_delivery");
}
