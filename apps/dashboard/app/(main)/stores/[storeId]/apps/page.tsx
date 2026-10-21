import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { listStoreIntegrations } from "@workspace/lib/integrations/server";
import { getAllCategories } from "@/actions/categories";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { isGoogleSheetsConfigured } from "@/lib/integrations/google-oauth.server";
import { storeHostname } from "@workspace/lib/storefront";
import { StoreApps } from "./apps.client";
import type { AppCategoryOption } from "./apps.types";

type CategoryNode = { id: string; name: string | null; nameAr: string | null; categories?: CategoryNode[] };

/** Flattens the admin category tree into "Parent › Child" options (P7-07 mapping). */
function categoryOptions(nodes: CategoryNode[], locale: string, prefix = ""): AppCategoryOption[] {
  return nodes.flatMap((node) => {
    const name = (locale === "ar" ? node.nameAr || node.name : node.name || node.nameAr) ?? "";
    const label = prefix ? `${prefix} › ${name}` : name;
    return [{ id: node.id, label }, ...categoryOptions(node.categories ?? [], locale, label)];
  });
}

export default async function StoreAppsPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const integrations = await listStoreIntegrations(store.sellerId, store.id);
  if (!integrations) notFound();

  const [locale, tree] = await Promise.all([getLocale(), getAllCategories()]);
  const categories = tree.success ? categoryOptions((tree.data ?? []) as CategoryNode[], locale) : [];

  return (
    <section className="mx-auto w-full max-w-[1120px] px-3.5 pt-[22px] pb-20 sm:px-6 sm:pt-8 sm:pb-24">
      <StoreApps
        storeId={store.id}
        store={{ name: store.name, logoUrl: store.logoUrl, hostname: storeHostname(store.subdomain), siteStatus: store.siteStatus }}
        initial={integrations}
        readOnly={store.status !== "active"}
        googleSheetsEnabled={isGoogleSheetsConfigured()}
        categories={categories}
      />
    </section>
  );
}
