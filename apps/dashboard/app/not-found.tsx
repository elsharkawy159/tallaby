import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";
import { EmptyState, SellerButton, SellerCard } from "@/components/seller-ui";

/** A URL that matches no dashboard route: translated, in the seller look, instead of Next's English default. */
export default async function NotFound() {
  const t = await getTranslations("errorPages");
  return (
    <div className="seller-shell grid min-h-dvh place-items-center bg-background p-4">
      <SellerCard className="w-full max-w-[480px]">
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
    </div>
  );
}
