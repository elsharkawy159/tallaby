"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { PartyPopper, X } from "lucide-react";
import { HomeCard, IconTile } from "./home-ui";

/**
 * First visit after signup (`/?welcome=1`). A new store is offline until it is
 * published, so this says so and points at the setup checklist below it.
 * Closing drops the query param.
 */
export function WelcomeBanner() {
  const t = useTranslations("home.welcome");
  const router = useRouter();

  return (
    <HomeCard aria-labelledby="welcome-title" className="flex items-start gap-3.5 border-primary/30 bg-primary-soft p-5">
      <IconTile icon={PartyPopper} className="size-11 rounded-xl" />
      <div className="min-w-0 flex-1">
        <h2 id="welcome-title" className="text-[15px] font-bold leading-normal">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <button
        type="button"
        onClick={() => router.replace("/", { scroll: false })}
        aria-label={t("close")}
        className="-me-1.5 -mt-1.5 grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <X className="size-4" aria-hidden />
      </button>
    </HomeCard>
  );
}
