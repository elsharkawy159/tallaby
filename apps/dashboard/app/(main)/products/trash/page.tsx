import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { listTrashedProducts } from "@workspace/lib/products/trash/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { ProductTrash } from "./trash.client";

// The seller's own products: never cached.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("products.trash");
  return { title: t("pageTitle"), description: t("subtitle") };
}

/** Products › Trash (0123, ROADMAP.md F-35): restore within 30 days, or delete for good. */
export default async function ProductTrashPage() {
  const seller = await requireSeller().catch((error) => error);
  if (isAccessError(seller)) redirect(seller.code === "no_seller" ? "/signup" : "/login");
  if (seller instanceof Error) throw seller;
  const locale = (await getLocale()) === "en" ? "en" : "ar";
  const items = await listTrashedProducts(seller.sellerId, locale);

  return (
    <section className="p-4 sm:p-6">
      <ProductTrash items={items} />
    </section>
  );
}
