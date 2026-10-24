import { redirect } from "next/navigation";

/** Old Sitemap tab URL: Sitemap & indexing is now a section of the single Domain & SEO page. */
export default async function StoreSitemapPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/stores/${encodeURIComponent(storeId)}/website/domain#sitemap`);
}
