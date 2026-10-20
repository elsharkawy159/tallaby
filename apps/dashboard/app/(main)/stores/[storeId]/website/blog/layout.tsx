import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";
import { StorePageHeader } from "@/components/stores/store-page-header";

export default async function StoreBlogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await loadWebsiteStorePage(storeId);

  return (
    <section className="mx-auto w-full space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      {children}
    </section>
  );
}
