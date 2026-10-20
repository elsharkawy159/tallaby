import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { cn } from "@workspace/ui/lib/utils";
import { generateNoIndexMetadata } from "@/lib/metadata";
import { resolveStorefront } from "@/lib/storefront.server";
import { StorefrontCart } from "../_components/storefront-cart.client";
import s from "../storefront.module.css";

export const metadata: Metadata = generateNoIndexMetadata();

type StorefrontCartPageProps = {
  params: Promise<{ locale: string; subdomain: string }>;
};

export default async function StorefrontCartPage({ params }: StorefrontCartPageProps) {
  const { subdomain } = await params;
  const [store, t] = await Promise.all([
    resolveStorefront(subdomain),
    getTranslations("storefront"),
  ]);

  return (
    <div className={s.wrap}>
      <div className="mx-auto max-w-2xl py-10 md:py-14">
        <h1 className={cn(s.sectionTitle, "mb-4")}>{t("cartTitle")}</h1>
        <StorefrontCart storeName={store.displayName} />
      </div>
    </div>
  );
}
