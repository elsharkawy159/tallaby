import { Suspense } from "react";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/seller-ui";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { legacyProductsTarget } from "@/lib/products/product-routes.lib";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { ProductStoreProvider } from "@/app/(main)/stores/[storeId]/products/_components/product-store.client";
import { VendorProductsData } from "@/app/(main)/stores/[storeId]/products/_components/vendor-products.data";
import { VendorProductsSkeleton } from "@/app/(main)/stores/[storeId]/products/_components/vendor-products.skeleton";

export const dynamic = "force-dynamic";

/**
 * The old account-wide Products URLs (ROADMAP.md F-87c slice 2). Products now
 * live under their store, `/stores/<id>/products/…`; bookmarks, emails, bell
 * rows already stored and other apps still link here, so this sends them to
 * the same page and query under the sidebar's selected store (only ever one of
 * the session seller's own stores; it is navigation, never a write target).
 *
 * A seller with no store yet keeps what `/products` showed before: the
 * account list. Every other Products page needs a store (product saves have
 * refused without one since slice 1), so those go to My stores to create one.
 */
export default async function LegacyProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ path }, query] = await Promise.all([params, searchParams]);
  const stores = await getSellerStores().catch((error: unknown) => error);
  if (isAccessError(stores)) redirect(stores.code === "no_seller" ? "/signup" : "/login");
  if (stores instanceof Error) throw stores;
  const { selected } = stores as Awaited<ReturnType<typeof getSellerStores>>;

  if (selected) redirect(legacyProductsTarget(selected.id, path, query));
  if (path?.length) redirect("/stores");

  return (
    <ProductStoreProvider storeId="">
      <PageContainer>
        <Suspense fallback={<VendorProductsSkeleton />}>
          <VendorProductsData storeId={null} searchParams={query} />
        </Suspense>
      </PageContainer>
    </ProductStoreProvider>
  );
}
