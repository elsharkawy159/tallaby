import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { EmptyState, SellerButton, SellerCard } from "@/components/seller-ui";

/** A URL that matches no dashboard route: translated, in the seller look, instead of Next's English default. */
export default async function NotFound() {
  const t = await getTranslations("errorPages");
  return (
    <div className="seller-shell grid min-h-dvh place-items-center bg-background p-4">
      <SellerCard className="w-full max-w-[480px]">
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
    </div>
  );
}
