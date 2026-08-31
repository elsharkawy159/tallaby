import { formatCurrency } from "@workspace/lib";

export { formatCurrency };

function resolveLocale(locale?: string): string {
  if (locale?.startsWith("ar")) return "ar-EG";
  if (locale?.startsWith("en")) return "en-EG";
  return "ar-EG";
}

export function formatDate(
  value: string | Date | null | undefined,
  locale?: string
): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(resolveLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatAddress(address: {
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode?: string | null;
  country?: string | null;
} | null | undefined): string {
  if (!address) return "—";
  return [
    address.addressLine1,
    address.addressLine2,
    address.city,
    address.state,
    address.postalCode,
    // The DB carries a legacy stray-quote default ("'Egypt") on this column.
    address.country?.replace(/^'/, ""),
  ]
    .filter(Boolean)
    .join(", ");
}
