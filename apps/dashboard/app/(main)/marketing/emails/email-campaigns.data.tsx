import { getLocale, getTranslations } from "next-intl/server";
import { emailCampaignLimits } from "@workspace/lib/email-campaigns";
import {
  countCampaignsQueuedToday,
  countStoreUnsubscribed,
  getStoreWinback,
  listCampaignProductOptions,
  listStoreCampaigns,
} from "@workspace/lib/email-campaigns/server";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { EmailCampaignsView } from "./email-campaigns.client";

/**
 * Marketing › Email campaigns (ROADMAP.md F-16a, F-16e): campaigns and the
 * win-back settings of one store the session's seller owns. The URL's store
 * wins when it is one of theirs, else the sidebar's selected store. Read
 * fresh on every request (personal data; counts only, never addresses).
 */
export async function EmailCampaignsData(props: { storeId: string | null }) {
  const [seller, { stores, selected }, t, locale] = await Promise.all([
    requireSeller(),
    getSellerStores(),
    getTranslations("emailCampaigns"),
    getLocale(),
  ]);
  const store = stores.find((s) => s.id === props.storeId) ?? selected;

  const data = store
    ? await Promise.all([
        listStoreCampaigns(seller.sellerId, store.id),
        getStoreWinback(seller.sellerId, store.id),
        listCampaignProductOptions(seller.sellerId, store.id, locale),
        countStoreUnsubscribed(seller.sellerId, store.id),
        countCampaignsQueuedToday(seller.sellerId, store.id),
      ])
    : null;

  return (
    <section aria-label={t("title")} className="space-y-5">
      <p className="text-pretty text-sm text-muted-foreground">{t("description")}</p>
      <EmailCampaignsView
        key={store?.id ?? "none"}
        stores={stores.map((s) => ({ id: s.id, name: s.name }))}
        storeId={store?.id ?? null}
        storeLive={store ? store.status === "active" && store.siteStatus === "published" : false}
        limits={emailCampaignLimits(seller.plan)}
        data={
          data
            ? {
                campaigns: data[0],
                winback: data[1],
                products: data[2],
                unsubscribed: data[3],
                queuedToday: data[4],
              }
            : null
        }
      />
    </section>
  );
}
