import { permanentRedirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Delivery tracking moved under Orders & Shipping (PLAN.md §7.2, P3-06). */
export default async function ShippingRedirect() {
  permanentRedirect({ href: "/orders/delivery", locale: await getLocale() });
}
