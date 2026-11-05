"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { RotateCw, TriangleAlert } from "lucide-react";
import { EmptyState, PageContainer, SellerButton, SellerCard } from "@/components/seller-ui";

/** A page that throws while rendering: the shell stays, with a retry, instead of Next's English fallback. */
export default function DashboardError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("errorPages");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageContainer narrow>
      <SellerCard>
        <EmptyState
          icon={TriangleAlert}
          title={<h1 className="text-[17px]">{t("errorTitle")}</h1>}
          description={t("errorBody")}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <SellerButton type="button" variant="solid" onClick={() => retry()}>
                <RotateCw aria-hidden />
                {t("retry")}
              </SellerButton>
              <SellerButton asChild variant="outline">
                <Link href="/">{t("home")}</Link>
              </SellerButton>
            </div>
          }
        />
      </SellerCard>
    </PageContainer>
  );
}
