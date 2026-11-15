import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { listStoreLeadSettings } from "@workspace/lib/checkout-leads/server";
import { Note, PageHeader } from "@/components/seller-ui";
import { requireOrdersStore } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { PendingCartsView } from "./pending-carts.client";
import { parsePendingCartsFilters, PENDING_CART_MAX_AGE_DAYS } from "./pending-carts.lib";
import { listStorePendingCarts } from "./pending-carts.query";

/**
 * Orders › Pending carts (ROADMAP.md F-67): one page of the carts of a store the
 * session's seller owns. The URL's store wins when it is one of theirs, else the
 * sidebar's selected store. Read fresh on every request (personal data).
 */
export async function PendingCartsData({
  storeId,
  searchParams,
}: {
  storeId: string | null;
  searchParams: { page?: unknown; size?: unknown };
}) {
  const [{ stores, selected }, t, locale] = await Promise.all([
    getSellerStores(),
    getTranslations("pendingCarts"),
    getLocale(),
  ]);
  const picked = stores.find((s) => s.id === storeId) ?? selected;
  const missedHref = picked ? `/orders/missed?store=${picked.id}` : "/orders/missed";

  const header = (
    <>
      <PageHeader title={t("title")} description={t("description", { days: PENDING_CART_MAX_AGE_DAYS })} />
      <Note>
        {t("notCompletedHint")}{" "}
        <Link href={missedHref} className="text-(--s-link) underline-offset-4 hover:underline max-[600px]:inline-flex max-[600px]:min-h-10 max-[600px]:items-center">
          {t("notCompletedLink")}
        </Link>
      </Note>
    </>
  );

  if (!picked) {
    return (
      <>
        {header}
        <PendingCartsView list={{ carts: [], total: 0, page: 1, pages: 1, size: 20 }} store={null} storeName={null} />
      </>
    );
  }

  const { seller, store } = await requireOrdersStore(picked.id);
  const filters = parsePendingCartsFilters(searchParams);
  // Sequential on purpose: the serverless pool is small.
  const list = await listStorePendingCarts(seller.sellerId, store.id, filters, locale);
  const settings = list.total > 0 ? await listStoreLeadSettings(seller.sellerId) : [];

  return (
    <>
      {header}
      <PendingCartsView
        key={store.id}
        list={list}
        store={settings.find((s) => s.storeId === store.id) ?? null}
        storeName={stores.length > 1 ? store.name : null}
      />
    </>
  );
}
