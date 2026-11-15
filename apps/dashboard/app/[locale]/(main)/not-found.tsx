import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { EmptyState, PageContainer, SellerButton, SellerCard } from "@/components/seller-ui";

/** A `notFound()` inside the dashboard (a deleted product, another seller's store, a hidden page). */
export default async function DashboardNotFound() {
  const t = await getTranslations("errorPages");
  return (
    <PageContainer narrow>
      <SellerCard>
        <Image
          src="/illustrations/status/not-found.png"
          alt=""
          aria-hidden
          width={160}
          height={160}
          className="mx-auto mt-[26px] block size-40 select-none"
        />
        <EmptyState
          className="pt-0"
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
