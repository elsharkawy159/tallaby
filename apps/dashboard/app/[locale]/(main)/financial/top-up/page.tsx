import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/**
 * Kashier top-ups started before the wallet moved to /wallet return here;
 * forward them (with the top-up id) to the new result page.
 */
export default async function LegacyTopUpReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ topUp?: string | string[] }>;
}) {
  const { topUp } = await searchParams;
  redirect({ href: typeof topUp === "string" ? `/wallet/top-up?topUp=${encodeURIComponent(topUp)}` : "/wallet", locale: await getLocale() });
}
