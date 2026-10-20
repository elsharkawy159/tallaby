import { loadStorePage } from "@/lib/stores/store-page.server";
import { loadDomainTab } from "./domain-seo.data";
import { DomainTab } from "./domain-tab.client";

export default async function StoreDomainPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const data = await loadDomainTab(store);

  return (
    <DomainTab
      store={{ id: store.id, subdomain: store.subdomain, isPrimary: store.isPrimary, readOnly: store.status !== "active" }}
      {...data}
    />
  );
}
