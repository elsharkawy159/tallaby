import { getTranslations } from "next-intl/server";
import { listStoreCustomerNotes, listStoreCustomers } from "@workspace/lib/customers/server";
import { listStoreBlockedPhones } from "@workspace/lib/stores/blocked-phones/server";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { CustomersView } from "./customers.client";

/**
 * Orders › Customers (ROADMAP.md F-01b): the customers of one store the
 * session's seller owns. The URL's store wins when it is one of theirs, else
 * the sidebar's selected store. Read fresh on every request (personal data).
 */
export async function CustomersData({ storeId }: { storeId: string | null }) {
  const [seller, { stores, selected }, t] = await Promise.all([
    requireSeller(),
    getSellerStores(),
    getTranslations("customers"),
  ]);
  const store = stores.find((s) => s.id === storeId) ?? selected;

  const [customers, blocked, notes] = store
    ? await Promise.all([
        listStoreCustomers(seller.sellerId, store.id),
        listStoreBlockedPhones(store.id),
        listStoreCustomerNotes(seller.sellerId, store.id),
      ])
    : [[], [], new Map()];

  return (
    <section aria-label={t("title")} className="space-y-5">
      {/* No page title: the header breadcrumb already names the page. */}
      <p className="text-pretty text-sm text-muted-foreground">{t("description")}</p>
      <CustomersView
        key={store?.id ?? "none"}
        customers={customers}
        blockedPhones={blocked.map((b) => b.phone)}
        notes={Object.fromEntries(notes)}
        stores={stores.map((s) => ({ id: s.id, name: s.name }))}
        storeId={store?.id ?? null}
      />
    </section>
  );
}
