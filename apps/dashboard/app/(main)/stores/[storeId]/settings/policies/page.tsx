import { loadStorePage } from "@/lib/stores/store-page.server";
import { StorePoliciesForm } from "./store-policies.client";

export default async function StorePoliciesPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadStorePage(storeId);
  const policies = (store.policies ?? {}) as Record<string, string | undefined>;

  return (
    <StorePoliciesForm
      storeId={store.id}
      readOnly={store.status !== "active"}
      initial={{
        return: policies.return ?? "",
        shipping: policies.shipping ?? "",
        privacy: policies.privacy ?? "",
        terms: policies.terms ?? "",
      }}
    />
  );
}
