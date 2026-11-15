import { redirect } from "next/navigation";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Old SEO URL: SEO has its own page, Website › SEO, since 2026-11-09. */
export default async function StoreSeoRedirect({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/stores/${encodeURIComponent(storeId)}/website/seo`);
}
