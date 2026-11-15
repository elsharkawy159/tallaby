import { PageContainer } from "@/components/seller-ui";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function StoreBlogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  await loadWebsiteStorePage(storeId);

  return <PageContainer narrow>{children}</PageContainer>;
}
