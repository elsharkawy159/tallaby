import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import {
  CUSTOMER_PAGE_SIZE_COOKIE,
  normalizeCustomerTags,
  parseCustomersListFilters,
  type CustomersListFilters,
} from "@workspace/lib/customers";
import { listStoreCustomerNotes, listStoreCustomersPage } from "@workspace/lib/customers/server";
import { blockedPhoneCustomerKey } from "@workspace/lib/stores/blocked-phones";
import { listStoreBlockedPhones } from "@workspace/lib/stores/blocked-phones/server";
import { loadStoreMoney } from "@/lib/stores/account-money.server";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { CustomersView } from "./customers.client";

/**
 * Orders › Customers (ROADMAP.md F-01b, F-43e): one page of the customers of a
 * store the session's seller owns. The URL's store wins when it is one of
 * theirs, else the sidebar's selected store. Read fresh on every request
 * (personal data).
 */
export async function CustomersData({
  storeId,
  searchParams,
}: {
  storeId: string | null;
  searchParams: Partial<Record<keyof CustomersListFilters, string | string[] | undefined>>;
}) {
  const [seller, { stores, selected }, t, cookieStore] = await Promise.all([
    requireSeller(),
    getSellerStores(),
    getTranslations("customers"),
    cookies(),
  ]);
  const store = stores.find((s) => s.id === storeId) ?? selected;
  const parsed = parseCustomersListFilters(searchParams, cookieStore.get(CUSTOMER_PAGE_SIZE_COOKIE)?.value);

  const money = store ? (await loadStoreMoney(seller.sellerId))[store.id] : undefined;
  const [blocked, allNotes] = store
    ? await Promise.all([listStoreBlockedPhones(store.id), listStoreCustomerNotes(seller.sellerId, store.id)])
    : [[], new Map()];
  const allTags = normalizeCustomerTags([...allNotes.values()].flatMap((n) => n.tags));
  // A tag that no longer exists (old link) is no filter, as the page always treated it.
  const tag = allTags.find((x) => x.toLowerCase() === parsed.tag.toLowerCase()) ?? "";
  const filters = { ...parsed, tag };

  const list = store
    ? await listStoreCustomersPage(seller.sellerId, store.id, filters)
    : { customers: [], stats: { customers: 0, repeat: 0, refused: 0 }, matched: 0, page: 1, pages: 1 };

  return (
    <section aria-label={t("title")} className="space-y-5">
      {/* No page title: the header breadcrumb already names the page. */}
      <p className="text-pretty text-sm text-muted-foreground">{t("description")}</p>
      <CustomersView
        money={money}
        key={store?.id ?? "none"}
        customers={list.customers}
        stats={list.stats}
        matched={list.matched}
        pages={list.pages}
        filters={{ ...filters, page: list.page }}
        blockedPhones={blocked.map((b) => blockedPhoneCustomerKey(b.phone))}
        notes={Object.fromEntries(
          list.customers.flatMap((c) => {
            const note = allNotes.get(c.key);
            return note ? [[c.key, note]] : [];
          }),
        )}
        allTags={allTags}
        stores={stores.map((s) => ({ id: s.id, name: s.name }))}
        storeId={store?.id ?? null}
      />
    </section>
  );
}
