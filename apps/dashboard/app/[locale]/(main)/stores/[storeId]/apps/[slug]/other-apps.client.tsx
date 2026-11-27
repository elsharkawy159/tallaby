"use client";

import { useLocale, useTranslations } from "next-intl";
import type { AppId } from "@workspace/apps";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@workspace/ui/components/carousel";
import { Link } from "@/i18n/navigation";
import { AppLogo } from "../app-logo";
import { AppPrice } from "./app-actions.client";

export type OtherApp = {
  id: AppId;
  name: string;
  summary: string;
  href: string;
  freeWithPro: boolean;
};

/**
 * "Other apps" under an app page (owner, 2026-11-27): a few apps this store
 * has not installed yet, in random order (picked on the server), in the shared
 * shadcn carousel. Swipe on phones; arrows beside the heading.
 */
export function OtherApps({ apps, allHref }: { apps: OtherApp[]; allHref: string }) {
  const t = useTranslations("appDetail.other");
  const locale = useLocale();
  if (apps.length === 0) return null;

  return (
    <section aria-labelledby="other-apps">
      <Carousel opts={{ align: "start", dragFree: true, direction: locale.startsWith("ar") ? "rtl" : "ltr" }} className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 id="other-apps" className="text-[15.5px] font-bold text-(--s-ink)">
            {t("title")}
          </h2>
          <div className="flex items-center gap-2">
            <Link href={allHref} className="text-[13px] font-bold text-(--s-link) hover:underline max-[600px]:min-h-10 max-[600px]:content-center">
              {t("all")}
            </Link>
            <CarouselPrevious className="static size-9 translate-y-0 max-[600px]:hidden" aria-label={t("previous")} />
            <CarouselNext className="static size-9 translate-y-0 max-[600px]:hidden" aria-label={t("next")} />
          </div>
        </div>
        <CarouselContent className="pb-1">
          {apps.map((app) => (
            <CarouselItem key={app.id} className="basis-[260px] max-[600px]:basis-[78%]">
              <Link
                href={app.href}
                className="flex h-full flex-col gap-3 rounded-[22px] border border-(--s-line) bg-(--s-glass) p-4 text-start no-underline shadow-(--s-shadow-card) transition-[border-color,box-shadow] duration-150 hover:border-(--s-outline-hover) hover:shadow-(--s-shadow-hover) focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-(--s-focus) max-[600px]:rounded-[20px]"
              >
                <div className="flex items-center gap-3">
                  <AppLogo app={app.id} className="size-11 rounded-[13px]" />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold text-(--s-ink)">{app.name}</p>
                    <p className="text-[12px] text-(--s-subtle)">
                      <AppPrice appId={app.id} freeWithPro={app.freeWithPro} />
                    </p>
                  </div>
                </div>
                <p className="line-clamp-2 text-[12.5px] leading-[1.7] text-(--s-muted)">{app.summary}</p>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
