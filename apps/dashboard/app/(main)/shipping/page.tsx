import { permanentRedirect } from "next/navigation";

/** Delivery tracking moved under Orders & Shipping (PLAN.md §7.2, P3-06). */
export default function ShippingRedirect() {
  permanentRedirect("/orders/delivery");
}
