import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRight, Store } from "lucide-react";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { IconTile, PageContainer, PageHeader, Row, Rows } from "@/components/seller-ui";
import { currentOrderLock, requireSeller } from "@/lib/auth/require-seller.server";
import { loadStoreMoney } from "@/lib/stores/account-money.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { ManualOrderForm } from "./manual-order.client";

export const dynamic = "force-dynamic";

/** Orders › Create order (ROADMAP.md F-05). The store comes from the URL, never a cookie. */
export default async function NewManualOrderPage({ searchParams }: { searchParams: Promise<{ store?: string | string[] }> }) {
  const lock = await currentOrderLock();
  if (lock.ordersLocked) return <OrdersLocked lock={lock} />;

  const [seller, { store: storeParam }, { stores }, t] = await Promise.all([
    requireSeller(),
    searchParams,
    getSellerStores(),
    getTranslations("manualOrder"),
  ]);
  const storeMoney = stores.length > 0 ? await loadStoreMoney(seller.sellerId) : {};
  const wanted = Array.isArray(storeParam) ? storeParam[0] : storeParam;
  const store = stores.find((s) => s.id === wanted) ?? (stores.length === 1 ? stores[0] : null);

  return (
    <PageContainer narrow>
      <PageHeader title={t("title")} description={store ? t("subtitle", { store: store.name }) : t("chooseStore")} />
      {store ? (
        <ManualOrderForm money={storeMoney[store.id]} storeId={store.id} storeName={store.name} />
      ) : (
        <Rows>
          {stores.map((s) => (
            <Link key={s.id} href={`/orders/new?store=${s.id}`} className="block no-underline [&+&]:border-t [&+&]:border-(--s-line-soft)">
              <Row
                start={<IconTile icon={Store} />}
                title={s.name}
                end={<ChevronRight className="size-4 text-(--s-subtle) rtl:rotate-180" aria-hidden />}
              />
            </Link>
          ))}
        </Rows>
      )}
    </PageContainer>
  );
}
