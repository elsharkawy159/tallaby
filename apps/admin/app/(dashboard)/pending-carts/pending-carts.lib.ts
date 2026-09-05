import type { PendingCart } from "./pending-carts.types";
import { formatCurrency as formatCurrencyValue } from "@workspace/lib";

export const formatCurrency = (amount: number): string => {
  return formatCurrencyValue(amount);
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateString));
};

export const getCustomerName = (cart: PendingCart): string => {
  if (!cart.user) return "Unknown customer";
  return cart.user.fullName?.trim() || "Unknown customer";
};

export const getCustomerEmail = (cart: PendingCart): string => {
  return cart.user?.email || "No email";
};

export const getCustomerInitials = (cart: PendingCart): string => {
  const name = getCustomerName(cart);
  if (name === "Unknown customer") return "?";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const shortenId = (id: string): string => {
  return id.slice(0, 8);
};

export const formatVariant = (variant: unknown): string | null => {
  if (!variant) return null;
  if (typeof variant === "string") return variant;
  if (typeof variant === "object") {
    const entries = Object.entries(variant as Record<string, unknown>).filter(
      ([, value]) => value != null && value !== ""
    );
    if (!entries.length) return null;
    return entries.map(([key, value]) => `${key}: ${String(value)}`).join(", ");
  }
  return String(variant);
};
