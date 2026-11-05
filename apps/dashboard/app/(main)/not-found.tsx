import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";
import { EmptyState, PageContainer, SellerButton, SellerCard } from "@/components/seller-ui";

/** A `notFound()` inside the dashboard (a deleted product, another seller's store, a hidden page). */
export default async function DashboardNotFound() {
  const t = await getTranslations("errorPages");
  return (
    <PageContainer narrow>
      <SellerCard>
        <EmptyState
          icon={SearchX}
          title={<h1 className="text-[17px]">{t("notFoundTitle")}</h1>}
          description={t("notFoundBody")}
          action={
            <SellerButton asChild variant="solid">
              <Link href="/">{t("home")}</Link>
            </SellerButton>
          }
        />
      </SellerCard>
    </PageContainer>
  );
}
