import { getLocale } from "next-intl/server";
import { storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { getPublishedStoreSite } from "@workspace/lib/store-sites/server";
import type { StoreRow } from "@workspace/lib/stores/server";
import { loadOrderLock, requireSeller } from "@/lib/auth/require-seller.server";
import { isStoreSiteLive } from "@/lib/products/product-view-url.lib";
import { StoreQrCodes } from "./qr-codes.client";

export async function StoreQrCodesScreen({ store }: { store: StoreRow }) {
  // The App Center already authorizes the store before invoking this loader.
  const seller = await requireSeller();
  const published = seller.status === "approved" && isStoreSiteLive(store);
  const offline = published && (await loadOrderLock(seller.sellerId)).storeOffline;
  if (!published || offline) return <StoreQrCodes storeId={store.id} baseUrl={null} pages={[]} />;

  const [domain, site, locale] = await Promise.all([
    findActiveCustomDomainForSubdomain(store.subdomain),
    getPublishedStoreSite(store.id),
    getLocale(),
  ]);
  const pages = (site?.pages ?? []).flatMap((page) =>
    page.isHome || page.kind === "product" ? [] : [{
      id: page.slug,
      label: page.names?.[locale === "en" ? "en" : "ar"] || page.name,
    }],
  );
  return <StoreQrCodes key={store.id} storeId={store.id} baseUrl={storeUrl(store.subdomain, domain)} pages={pages} />;
}
