"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PartyPopper, X } from "lucide-react";
import { IconButton, IconTile, SellerCard } from "@/components/seller-ui";

/**
 * First visit after signup (`/?welcome=1`). A new store is offline until it is
 * published, so this says so and points at the setup checklist below it.
 * Closing drops the query param.
 */
export function WelcomeBanner() {
  const t = useTranslations("home.welcome");
  const router = useRouter();

  return (
    <SellerCard aria-labelledby="welcome-title" className="flex items-start gap-3.5 border-(--s-outline) bg-primary-soft p-5">
      <IconTile icon={PartyPopper} tone="solid" size="lg" />
      <div className="min-w-0 flex-1">
        <h2 id="welcome-title" className="text-[15px] font-bold leading-normal text-(--s-ink)">
          {t("title")}
        </h2>
        <p className="mt-1 text-[13.5px] text-(--s-muted)">{t("description")}</p>
      </div>
      <IconButton onClick={() => router.replace("/", { scroll: false })} aria-label={t("close")} className="-me-1.5 -mt-1.5">
        <X aria-hidden />
      </IconButton>
    </SellerCard>
  );
}
