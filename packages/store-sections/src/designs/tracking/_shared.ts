/**
 * Shared bits of the order-tracking designs. The store has no order lookup a
 * section can call, so these designs explain how tracking works and send the
 * customer to their orders page (signed in) or to the seller on WhatsApp
 * (guests). The WhatsApp number is a placeholder the seller replaces.
 */
import type { StyleValues } from "../../elements/style";

/** The seller's WhatsApp chat; `?text=` messages are appended per link. */
export const WA = "https://wa.me/201001234567";

/** The signed-in customer's orders page (real order status lives there). */
export const ORDERS_HREF = "/profile/orders";

/** The narrow bordered card most tracking designs sit in. */
export const TRACK_CARD: StyleValues = {
  background: "background",
  borderWidth: 1,
  borderColor: "border",
  radius: 24,
  paddingTop: 36,
  paddingBottom: 36,
  paddingStart: 36,
  paddingEnd: 36,
};
export const TRACK_CARD_MOBILE: StyleValues = {
  paddingTop: 22,
  paddingBottom: 22,
  paddingStart: 22,
  paddingEnd: 22,
};

/** A round sun disc behind a big icon. */
export function discStyle(size: number): StyleValues {
  return {
    background: "accent",
    color: "foreground",
    radius: 999,
    width: `${size}px`,
    minHeight: size,
    paddingTop: Math.round(size * 0.24),
    paddingBottom: Math.round(size * 0.2),
    textAlign: "center",
  };
}
