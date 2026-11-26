import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Old Submissions tab URL: the inbox is now a section of the single Forms page (filters kept). */
export default async function StoreFormSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ storeId }, query] = await Promise.all([params, searchParams]);
  // The forms layout no longer checks the store: a foreign store stays a 404 here, not a redirect.
  await loadWebsiteStorePage(storeId);
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    for (const v of Array.isArray(value) ? value : value === undefined ? [] : [value]) search.append(key, v);
  }
  const qs = search.toString();
  redirect({ href: `/stores/${encodeURIComponent(storeId)}/website/forms${qs ? `?${qs}` : ""}#submissions`, locale: await getLocale() });
}
