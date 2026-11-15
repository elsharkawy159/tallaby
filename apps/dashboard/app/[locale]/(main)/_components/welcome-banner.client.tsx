"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { IconButton, SellerCard } from "@/components/seller-ui";

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
      <Image src="/illustrations/onboarding/welcome.png" alt="" aria-hidden width={64} height={64} className="size-16 shrink-0 select-none" />
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
