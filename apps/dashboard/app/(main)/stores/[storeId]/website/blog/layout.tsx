import { PageContainer } from "@/components/seller-ui";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";

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
