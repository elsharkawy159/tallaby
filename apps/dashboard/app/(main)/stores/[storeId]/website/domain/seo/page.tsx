import { parseStoreSeo } from "@workspace/lib/stores";
import { storeHostname } from "@workspace/lib/storefront";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { loadLiveDomain } from "../domain-seo.data";
import { toSeoFormValues } from "../domain-seo.dto";
import { StoreSeoForm } from "./seo-form.client";

export default async function StoreSeoPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const liveDomain = await loadLiveDomain(store);

  return (
    <StoreSeoForm
      storeId={store.id}
      storeName={store.name}
      storeHost={liveDomain ?? storeHostname(store.subdomain)}
      hasCustomDomain={Boolean(liveDomain)}
      initial={toSeoFormValues(parseStoreSeo(store.seo))}
      readOnly={store.status !== "active"}
    />
  );
}
