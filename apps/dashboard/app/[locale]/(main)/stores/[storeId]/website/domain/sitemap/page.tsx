import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Old Sitemap URL: the sitemap and robots addresses live in Apps › Google Search Console since 2026-11-27. */
export default async function StoreSitemapRedirect({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect({ href: `/stores/${encodeURIComponent(storeId)}/apps/google-search-console/settings`, locale: await getLocale() });
}
