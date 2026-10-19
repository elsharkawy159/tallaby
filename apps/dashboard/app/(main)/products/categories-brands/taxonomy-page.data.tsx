import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { loadSellerTaxonomyList } from "./categories-brands.data";
import { TaxonomyManager } from "./categories-brands.client";
import type { TaxonomyKind } from "./categories-brands.dto";

/** Shared by the Products › Categories and Products › Brands pages. */

const KEY: Record<TaxonomyKind, "categories" | "brands"> = { category: "categories", brand: "brands" };

export async function taxonomyPageMetadata(kind: TaxonomyKind): Promise<Metadata> {
  const t = await getTranslations(`categoriesBrands.${KEY[kind]}`);
  return { title: t("pageTitle"), description: t("pageSubtitle") };
}

export async function TaxonomyPage({ kind }: { kind: TaxonomyKind }) {
  const seller = await requireSeller().catch((error) => error);
  if (isAccessError(seller)) redirect(seller.code === "no_seller" ? "/signup" : "/login");
  if (seller instanceof Error) throw seller;
  const items = await loadSellerTaxonomyList(seller.sellerId, kind);

  return (
    <section className="p-4 sm:p-6">
      <TaxonomyManager kind={kind} initialItems={items} />
    </section>
  );
}
