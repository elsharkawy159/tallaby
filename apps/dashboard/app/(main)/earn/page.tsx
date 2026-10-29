import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { EarnSection } from "./earn.data";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("earn");
  return { title: t("metaTitle") };
}

/** "اربح معنا": the seller's referral link, commissions and withdrawals (ROADMAP.md F-37). */
export default async function EarnPage() {
  const seller = await requireSeller().catch((error) => error);
  if (isAccessError(seller)) redirect(seller.code === "no_seller" ? "/signup" : "/login");
  if (seller instanceof Error) throw seller;

  return (
    <div className="p-4 sm:p-6">
      <EarnSection sellerId={seller.sellerId} />
    </div>
  );
}
