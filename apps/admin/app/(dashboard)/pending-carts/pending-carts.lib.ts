import type { PendingCart } from "./pending-carts.types";
import { formatCurrency as formatCurrencyValue } from "@workspace/lib";
import { getStorefrontBaseUrl } from "../products/products.lib";

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

/** Null for guests, whose synthetic `guest_<uid>@temp.local` address can't receive mail. */
export const getContactEmail = (cart: PendingCart): string | null => {
  const email = cart.user?.email?.trim();
  return email && !email.endsWith("@temp.local") ? email : null;
};

export const getCustomerEmail = (cart: PendingCart): string => {
  return getContactEmail(cart) ?? "No email";
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

/** "Design: Lemon (Cute Print)" → { name: "Design", value: "Lemon (Cute Print)" }. */
export const parseVariantOption = (
  option: string,
): { name: string | null; value: string } => {
  const separator = option.indexOf(":");
  if (separator <= 0) return { name: null, value: option };
  return {
    name: option.slice(0, separator).trim(),
    value: option.slice(separator + 1).trim() || option,
  };
};

/** The phone we'd message: the account phone, else the default address phone. */
export const getCartContactPhone = (cart: PendingCart): string | null =>
  cart.user?.phone?.trim() || cart.fallbackPhone?.trim() || null;

const REMINDER_ITEM_LIMIT = 5;

/** Egyptian-Arabic WhatsApp nudge listing the cart contents. */
export const buildCartReminderMessage = (cart: PendingCart): string => {
  const firstName = cart.user?.fullName?.trim().split(/\s+/)[0];
  const greeting = firstName ? `أهلاً ${firstName}` : "أهلاً بيك";

  const activeItems = cart.items.filter((item) => !item.savedForLater);
  const listed = activeItems.slice(0, REMINDER_ITEM_LIMIT).map((item) => {
    const variant =
      item.variantTitle && item.variantTitle !== item.productTitle
        ? ` (${item.variantTitle})`
        : "";
    return `• ${item.productTitle}${variant} × ${item.quantity}`;
  });
  const remaining = activeItems.length - listed.length;
  if (remaining > 0) listed.push(`• و${remaining} منتجات تانية`);

  return [
    greeting,
    "معاك فريق طلبي",
    "",
    "لاحظنا إن عندك منتجات لسه مستنياك في سلة التسوق ولسه الطلب ما اكتملش",
    ...(listed.length ? ["", ...listed] : []),
    "",
    "لو واجهتك أي مشكلة وانت بتعمل الطلب، أو محتاج أي مساعدة أو استفسار، رد علينا هنا على طول وهنساعدك فوراً",
    "",
    `تقدر تكمل طلبك من هنا: ${getStorefrontBaseUrl()}/cart`,
    "",
    "شكراً ليك",
  ].join("\n");
};
