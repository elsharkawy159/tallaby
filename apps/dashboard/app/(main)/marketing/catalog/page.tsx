import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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
    <section className="mx-auto w-full max-w-[560px] px-3.5 pt-[22px] pb-20 sm:px-6 sm:pt-8">
      <h1 className="text-xl font-bold">{t("title")}</h1>
      <p className="text-muted-foreground mt-1 mb-6 text-sm">{t("pageDescription")}</p>
      <div className="bg-card rounded-2xl border p-4 sm:p-6">
        <CatalogShareForm />
      </div>
    </section>
  );
}
