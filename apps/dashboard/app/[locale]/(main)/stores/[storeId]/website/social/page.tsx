import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { readStoreSocialLinks } from "@workspace/lib/stores";
import { PageContainer } from "@/components/seller-ui";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";
import { SiteOfflineNote } from "../_components/site-offline-note";
import { StoreSocialLinks } from "./social.client";
import { toSocialRows } from "./social.dto";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("websiteSocial");
  return { title: t("title") };
}

/** Website › Social media (PLAN.md §8.8, P4-15): linked platforms first, in their order, then the rest. */
export default async function WebsiteSocialPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadWebsiteStorePage(storeId);
  const rows = toSocialRows(readStoreSocialLinks(store.contact));
  const contact = (store.contact ?? {}) as { whatsapp?: string; phone?: string };

  return (
    <PageContainer>
      <StoreSocialLinks
        storeId={store.id}
        storeName={store.name}
        initial={rows}
        suggestedWhatsapp={contact.whatsapp || contact.phone || ""}
        readOnly={store.status !== "active"}
      >
        <SiteOfflineNote storeId={store.id} siteStatus={store.siteStatus} />
      </StoreSocialLinks>
    </PageContainer>
  );
}
