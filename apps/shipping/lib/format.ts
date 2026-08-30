import { formatCurrency } from "@workspace/lib";

export { formatCurrency };

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-EG", {
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
