import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRight } from "lucide-react";
import { OrdersLocked } from "@/components/orders/orders-locked";
import { currentOrderLock, requireSeller } from "@/lib/auth/require-seller.server";
import { loadStoreMoney } from "@/lib/stores/account-money.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { ManualOrderForm } from "./manual-order.client";

export const dynamic = "force-dynamic";

/** Orders › Create order (ROADMAP.md F-05). The store comes from the URL, never a cookie. */
export default async function NewManualOrderPage({ searchParams }: { searchParams: Promise<{ store?: string | string[] }> }) {
  const lock = await currentOrderLock();
  if (lock.locked) return <OrdersLocked lock={lock} />;

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
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto mb-5 w-full max-w-5xl">
        <h1 className="text-xl font-bold sm:text-2xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{store ? t("subtitle", { store: store.name }) : t("chooseStore")}</p>
      </div>
      {store ? (
        <ManualOrderForm money={storeMoney[store.id]} storeId={store.id} storeName={store.name} />
      ) : (
        <ul className="mx-auto w-full max-w-5xl space-y-2">
          {stores.map((s) => (
            <li key={s.id}>
              <Link href={`/orders/new?store=${s.id}`} className="flex items-center justify-between rounded-xl border bg-card p-4 text-sm font-medium hover:bg-muted/50">
                {s.name}
                <ChevronRight className="size-4 rtl:rotate-180" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
