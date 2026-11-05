import type { Metadata } from "next";
import { Share2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageContainer, PageHeader, SectionCard } from "@/components/seller-ui";
import { CatalogShareForm } from "./catalog-share.client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("catalogShare");
  return { title: t("title") };
}

/**
 * Marketing › Share catalog (ROADMAP.md F-11c): a link and a PDF of one store
 * category or the newest products, for WhatsApp. Picked products are shared
 * from the products list (select › Share catalog).
 */
export default async function CatalogSharePage() {
  const t = await getTranslations("catalogShare");
  return (
    <PageContainer narrow>
      <PageHeader title={t("title")} description={t("pageDescription")} />
      <SectionCard icon={Share2} title={t("title")} className="w-full max-w-[640px]">
        <CatalogShareForm />
      </SectionCard>
    </PageContainer>
  );
}
