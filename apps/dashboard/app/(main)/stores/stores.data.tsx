import { and, db, eq, sellerCustomDomains } from "@workspace/db";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { StoresView } from "./stores.client";
import type { StoreCardData } from "./stores.dto";

export async function StoresData({ openCreate }: { openCreate: boolean }) {
  const [seller, { stores, selected, maxStores }] = await Promise.all([requireSeller(), getSellerStores()]);

  // Active custom domains (one per store) so cards link to the address customers use.
  const domains = await db
    .select({ storeId: sellerCustomDomains.storeId, domain: sellerCustomDomains.domain })
    .from(sellerCustomDomains)
    .where(and(eq(sellerCustomDomains.sellerId, seller.sellerId), eq(sellerCustomDomains.status, "active")));
  const domainByStore = new Map(domains.map((d) => [d.storeId, d.domain]));

  const cards: StoreCardData[] = stores.map((store) => ({
    id: store.id,
    name: store.name,
    subdomain: store.subdomain,
    customDomain: domainByStore.get(store.id) ?? null,
    isPrimary: store.isPrimary,
    status: store.status,
    siteStatus: store.siteStatus,
    logoUrl: store.logoUrl,
    createdAt: store.createdAt,
  }));

  return (
    <StoresView
      stores={cards}
      selectedId={selected?.id ?? null}
      maxStores={maxStores}
      openCreate={openCreate && stores.length < maxStores}
    />
  );
}
