import { redirect } from "next/navigation";

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
  redirect(typeof topUp === "string" ? `/wallet/top-up?topUp=${encodeURIComponent(topUp)}` : "/wallet");
}
