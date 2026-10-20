import { parseStoreSeo } from "@workspace/lib/stores";
import { storeHostname } from "@workspace/lib/storefront";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { toSeoFormValues } from "../domain-seo.dto";
import { StoreSeoForm } from "./seo-form.client";

export default async function StoreSeoPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);

  return (
    <StoreSeoForm
      storeId={store.id}
      storeName={store.name}
      storeHost={storeHostname(store.subdomain)}
      initial={toSeoFormValues(parseStoreSeo(store.seo))}
      readOnly={store.status !== "active"}
    />
  );
}
