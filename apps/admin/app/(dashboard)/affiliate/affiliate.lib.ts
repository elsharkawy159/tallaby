import { formatCurrency as formatCurrencyValue } from "@workspace/lib";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export function money(value: string | number | null | undefined): string {
  return formatCurrencyValue(Number(value ?? 0));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    new Date(value)
  );
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function affiliateStatusVariant(status: string): BadgeVariant {
  return status === "active" ? "default" : "outline";
}

export function orderStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "delivered":
      return "default";
    case "cancelled":
    case "refund_requested":
    case "refunded":
    case "returned":
      return "destructive";
    case "pending":
      return "outline";
    default:
      return "secondary";
  }
}

export function commissionStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "earned":
      return "default";
    case "reversed":
      return "destructive";
    case "cancelled":
      return "outline";
    default:
      return "secondary";
  }
}

export function commissionStatusLabel(status: string): string {
  switch (status) {
    case "earned":
      return "Earned";
    case "reversed":
      return "Reversed";
    case "cancelled":
      return "Cancelled";
    default:
      return "Pending";
  }
}

export const AFFILIATE_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export const AFFILIATE_PERFORMANCE_OPTIONS = [
  { value: "has_orders", label: "Has orders" },
  { value: "no_orders", label: "No orders" },
  { value: "has_delivered", label: "Has delivered orders" },
];

export const AFFILIATE_EARNINGS_OPTIONS = [
  { value: "has_pending", label: "Has pending profit" },
  { value: "has_earned", label: "Has earned profit" },
];
