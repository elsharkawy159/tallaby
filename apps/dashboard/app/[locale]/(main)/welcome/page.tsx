import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

/**
 * `/welcome` used to open the selected store's welcome page, removed (owner,
 * 2026-11-28): the home's setup steps replace it. Old links land on the home.
 */
export default async function WelcomeRemovedPage() {
  redirect({ href: "/", locale: await getLocale() });
}
