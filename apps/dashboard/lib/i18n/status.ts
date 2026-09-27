// Translates DB enum values (order, shipment, payment, product status...) via
// the "status" message namespace, falling back to a humanised value for any
// enum member the messages don't know yet.
type StatusTranslator = {
  (key: string): string;
  has(key: string): boolean;
};

export type StatusGroup =
  | "order"
  | "shipping"
  | "payment"
  | "product"
  | "review"
  | "payout"
  | "transaction"
  | "coupon";

export function humanizeStatus(value: string) {
  return value.replace(/_/g, " ").replace(/^\w/, (m) => m.toUpperCase());
}

export function translateStatus(
  t: StatusTranslator,
  group: StatusGroup,
  value: string | null | undefined
) {
  if (!value) return "—";
  const key = `${group}.${value}`;
  return t.has(key) ? t(key) : humanizeStatus(value);
}
