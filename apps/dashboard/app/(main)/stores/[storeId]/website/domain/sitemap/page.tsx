import { redirect } from "next/navigation";

/** Old Sitemap URL: Sitemap & indexing is a section of Website › SEO since 2026-11-09. */
export default async function StoreSitemapRedirect({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/stores/${encodeURIComponent(storeId)}/website/seo#sitemap`);
}
