import { redirect } from "next/navigation";

/** Old SEO URL: SEO has its own page, Website › SEO, since 2026-11-09. */
export default async function StoreSeoRedirect({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/stores/${encodeURIComponent(storeId)}/website/seo`);
}
