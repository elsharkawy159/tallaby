import { PageContainer } from "@/components/seller-ui";
import { requireStore } from "@/lib/auth/require-seller.server";
import { loadStorePage } from "@/lib/stores/store-page.server";
import { EarningsSection } from "./earnings.data";
import { parsePage } from "./earnings.lib";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

/** Store › Tallaby Pay earnings (ROADMAP.md F-100f). Never cached: balances and withdrawals are money (rule 8). */
export default async function EarningsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const [{ storeId }, { page }] = await Promise.all([params, searchParams]);
  // A missing, deleted or foreign store is a 404 (rule 5).
  const store = await loadStorePage(storeId);
  const { seller } = await requireStore(store.id);

  return (
    <PageContainer>
      <EarningsSection
        sellerId={seller.sellerId}
        storeId={store.id}
        storeName={store.name}
        readOnly={store.status !== "active"}
        page={parsePage(page)}
      />
    </PageContainer>
  );
}
