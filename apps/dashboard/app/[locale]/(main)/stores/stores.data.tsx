import { and, db, eq, sellerCustomDomains } from "@workspace/db";
import { getLocale } from "next-intl/server";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { STORE_INDUSTRIES } from "@/lib/stores/industries.lib";
import { nicheChoices } from "@/lib/stores/niche-choices.lib";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { builderEnabled } from "../ai-builder/builder-access.server";
import { StoresView } from "./stores.client";
import type { StoreCardData } from "./stores.dto";

export async function StoresData({ openCreate }: { openCreate: boolean }) {
  const [seller, { stores, selected, maxStores, upgradeMaxStores }, locale] = await Promise.all([requireSeller(), getSellerStores(), getLocale()]);

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
      upgradeMaxStores={upgradeMaxStores}
      aiBuilder={builderEnabled()}
      openCreate={openCreate && stores.length < maxStores}
      // The create dialog's industry → niche choice, in the page's language.
      industries={STORE_INDUSTRIES.map((industry) => ({ id: industry.id, name: locale === "en" ? industry.en : industry.ar }))}
      nicheOptions={nicheChoices(
        STORE_INDUSTRIES.map((industry) => industry.id),
        locale,
      )}
    />
  );
}
