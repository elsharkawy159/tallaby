import { storeProfilePaymentMethods } from "@workspace/lib/payments/store-methods";
import { getStorefrontGateway } from "@workspace/lib/payments/store-gateways/server";
import { parseStoreCurrency } from "@workspace/lib";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { publicStoreSocialLinks } from "@workspace/lib/stores";
import { storeUrl } from "@workspace/lib/storefront";
import { PageContainer } from "@/components/seller-ui";
import { SiteOfflineNote } from "../_components/site-offline-note";
import { storeFontVariables } from "../_components/store-fonts";
import { loadWebsitePagesScreen, loadWebsiteStore } from "../website.data";
import { WebsitePages } from "./pages.client";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("websitePages");
  return { title: t("title") };
}

/** Website › Pages (PLAN.md P4-17): the pages and the header menu, plus the footer's preview and where to change it. */
export default async function WebsitePagesPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadWebsiteStore(storeId);
  const { pages, header, footer, designSystem } = await loadWebsitePagesScreen(store);
  const contact = (store.contact ?? {}) as { phone?: string; email?: string };

  return (
    <PageContainer narrow>
      <WebsitePages
        storeId={store.id}
        initial={pages}
        readOnly={store.status !== "active"}
        header={header}
        footer={footer}
        designSystem={designSystem}
        defaultLocale={store.defaultLocale === "en" ? "en" : "ar"}
        fontClassName={storeFontVariables}
        store={{
          name: store.name,
          description: store.description,
          logoUrl: store.logoUrl,
          bannerUrl: store.bannerUrl,
          url: storeUrl(store.subdomain),
          contact: { phone: contact.phone ?? null, email: contact.email ?? null },
          social: publicStoreSocialLinks(store.contact),
          paymentMethods: storeProfilePaymentMethods(store.settings, await getStorefrontGateway(store.id, store.sellerId).catch(() => null)),
          currency: parseStoreCurrency(store.settings).currency,
          policies: [],
        }}
      >
        <SiteOfflineNote storeId={store.id} siteStatus={store.siteStatus} />
      </WebsitePages>
    </PageContainer>
  );
}
