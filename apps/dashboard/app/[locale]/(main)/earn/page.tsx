import type { Metadata } from "next";
import { redirect } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { PageContainer } from "@/components/seller-ui";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { EarnSection } from "./earn.data";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("earn");
  return { title: t("metaTitle") };
}

/** Affiliate program ("برنامج التسويق بالعمولة", route /earn): the seller's referral link, commissions and withdrawals (ROADMAP.md F-37). */
export default async function EarnPage() {
  const seller = await requireSeller().catch((error) => error);
  if (isAccessError(seller)) redirect({ href: seller.code === "no_seller" ? "/signup" : "/login", locale: await getLocale() });
  if (seller instanceof Error) throw seller;

  return (
    <PageContainer narrow>
      <EarnSection sellerId={seller.sellerId} />
    </PageContainer>
  );
}
