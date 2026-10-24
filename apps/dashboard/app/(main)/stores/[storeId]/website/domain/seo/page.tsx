import { redirect } from "next/navigation";

/** Old SEO tab URL: SEO is now a section of the single Domain & SEO page. */
export default async function StoreSeoPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/stores/${encodeURIComponent(storeId)}/website/domain#seo`);
}
