import { getTranslations } from "next-intl/server";
import { parseSubscriberFilter, parseSubscriberPage, SUBSCRIBERS_PAGE_SIZE } from "@workspace/lib/store-forms/subscribers";
import { listStoreSubscribers } from "@workspace/lib/store-forms/subscribers/server";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { SubscribersView } from "./subscribers.client";

/**
 * Marketing › Subscribers (ROADMAP.md F-16d): newsletter sign-ups of one store
 * the session's seller owns. The URL's store wins when it is one of theirs,
 * else the sidebar's selected store. Read fresh on every request (personal data).
 */
export async function SubscribersData(props: {
  storeId: string | null;
  query: string | null;
  status: string | null;
  page: string | null;
}) {
  const [seller, { stores, selected }, t] = await Promise.all([
    requireSeller(),
    getSellerStores(),
    getTranslations("subscribers"),
  ]);
  const store = stores.find((s) => s.id === props.storeId) ?? selected;
  const status = parseSubscriberFilter(props.status);
  const page = parseSubscriberPage(props.page);
  const query = (props.query ?? "").trim().slice(0, 100);

  const result = store
    ? await listStoreSubscribers(seller.sellerId, store.id, { status, query, page })
    : null;

  return (
    <section aria-label={t("title")} className="space-y-5">
      {/* No page title: the header breadcrumb already names the page. */}
      <p className="text-pretty text-sm text-muted-foreground">{t("description")}</p>
      <SubscribersView
        key={`${store?.id ?? "none"}|${status}|${query}|${page}`}
        stores={stores.map((s) => ({ id: s.id, name: s.name }))}
        storeId={store?.id ?? null}
        status={status}
        query={query}
        page={page}
        pageSize={SUBSCRIBERS_PAGE_SIZE}
        result={result}
      />
    </section>
  );
}
