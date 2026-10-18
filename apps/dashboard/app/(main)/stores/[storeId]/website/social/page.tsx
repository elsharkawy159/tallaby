import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { readStoreSocialLinks } from "@workspace/lib/stores";
import { SOCIAL_PLATFORMS } from "@workspace/store-sections/social";
import { StorePageHeader } from "@/components/stores/store-page-header";
import { loadWebsiteStorePage } from "@/lib/stores/website-page.server";
import { StoreSocialLinks } from "./social.client";
import type { SocialRow } from "./social.dto";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("websiteSocial");
  return { title: t("title") };
}

/** Website › Social media (PLAN.md §8.8, P4-15): linked platforms first, in their order, then the rest. */
export default async function WebsiteSocialPage({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  const store = await loadWebsiteStorePage(storeId);
  const saved = readStoreSocialLinks(store.contact);
  const linked = new Set(saved.map((link) => link.platform));
  const rows: SocialRow[] = [
    ...saved.map((link) => ({ platform: link.platform, value: link.value, enabled: link.enabled })),
    ...SOCIAL_PLATFORMS.filter((p) => !linked.has(p.key)).map((p) => ({ platform: p.key, value: "", enabled: true })),
  ];
  const contact = (store.contact ?? {}) as { whatsapp?: string; phone?: string };

  return (
    <section className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
      <StorePageHeader store={store} />
      <StoreSocialLinks
        storeId={store.id}
        storeName={store.name}
        initial={rows}
        suggestedWhatsapp={contact.whatsapp || contact.phone || ""}
        readOnly={store.status !== "active"}
      />
    </section>
  );
}
