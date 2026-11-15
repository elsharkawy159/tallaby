"use client";

import { CalendarDays, Link2, Rocket, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@workspace/ui/components/sheet";
import { IconButton } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { CategoryChip, StatusPill, VoteButton } from "./roadmap-board.client";
import { statusStep } from "./roadmap.lib";
import { formatRoadmapDate, STATUS_STYLE } from "./roadmap-style.lib";
import { ROADMAP_STATUSES, type RoadmapItem } from "./roadmap.types";

/** Panel that slides in from the reading end with one idea's details. The design has no such panel; it follows the system. */
export function RoadmapDetail({
  item,
  onClose,
  onVote,
}: {
  item: RoadmapItem | null;
  onClose: () => void;
  onVote: (item: RoadmapItem) => void;
}) {
  const t = useTranslations("roadmap");
  const locale = useLocale();
  const step = item ? statusStep(item.status) : 0;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("detail.linkCopied"));
    } catch {
      /* clipboard blocked: nothing to do */
    }
  };

  return (
    <Sheet open={item != null} onOpenChange={(open) => !open && onClose()}>
      {/* The close button is the sheet's own: same size as the link button beside it, without the amber fill it gets from the shell's accent. */}
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        className="w-full gap-0 overflow-y-auto border-(--s-line) bg-(--s-surface) p-0 sm:max-w-[480px] [&>button:last-child]:top-3 [&>button:last-child]:end-3 [&>button:last-child]:grid [&>button:last-child]:size-10 [&>button:last-child]:place-items-center [&>button:last-child]:rounded-[11px] [&>button:last-child]:bg-transparent [&>button:last-child]:text-(--s-subtle) [&>button:last-child]:opacity-100 [&>button:last-child]:hover:bg-(--s-hover)"
      >
        {item && (
          <>
            <div className="flex min-h-16 items-center gap-2 border-b border-(--s-line-soft) px-5 py-3 pe-14">
              <StatusPill status={item.status} />
              <CategoryChip category={item.category} />
              <IconButton onClick={copyLink} aria-label={t("detail.copyLink")} className="ms-auto size-10">
                <Link2 />
              </IconButton>
            </div>

            <div className="flex flex-col gap-6 px-5 py-5">
              <div className="flex items-start gap-3.5">
                <VoteButton item={item} onVote={onVote} size="lg" />
                <div className="min-w-0">
                  <SheetTitle className="text-lg font-bold leading-[1.5] text-pretty text-(--s-ink)">
                    {item.title}
                  </SheetTitle>
                  <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--s-subtle)">
                    <span className="inline-flex items-center gap-1">
                      <Store className="size-3.5" />
                      {item.author ?? t("team")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {t("detail.added", { date: formatRoadmapDate(item.createdAt, locale) })}
                    </span>
                    {item.launchedAt && (
                      <span className="inline-flex items-center gap-1 text-success">
                        <Rocket className="size-3.5" />
                        {t("detail.launchedOn", { date: formatRoadmapDate(item.launchedAt, locale) })}
                      </span>
                    )}
                  </SheetDescription>
                </div>
              </div>

              <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-3 text-[13.5px]">
                <dt className="text-(--s-subtle)">{t("list.status")}</dt>
                <dd>
                  <StatusPill status={item.status} />
                </dd>
                <dt className="text-(--s-subtle)">{t("list.category")}</dt>
                <dd>
                  <CategoryChip category={item.category} />
                </dd>
                <dt className="text-(--s-subtle)">{t("detail.suggestedBy")}</dt>
                <dd className="truncate font-semibold text-(--s-text)">{item.author ?? t("team")}</dd>
                <dt className="text-(--s-subtle)">{t("list.votes")}</dt>
                <dd className="text-(--s-text)">
                  {t("detail.voters", { count: item.votes })}
                  {item.voted && <span className="text-(--s-subtle)"> · {t("detail.youVoted")}</span>}
                </dd>
              </dl>

              <div>
                <h3 className="mb-2 text-[13.5px] font-bold text-(--s-text)">{t("detail.progress")}</h3>
                <div className="flex gap-1.5">
                  {ROADMAP_STATUSES.map((s, k) => (
                    <span
                      key={s}
                      className={cn("h-1.5 flex-1 rounded-full", k <= step ? STATUS_STYLE[item.status].bar : "bg-(--s-fill)")}
                    />
                  ))}
                </div>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5 text-[11.5px] text-(--s-subtle)">
                  {ROADMAP_STATUSES.map((s, k) => (
                    <span key={s} className={cn("truncate", k === step && "font-bold text-(--s-text)")}>
                      {t(`status.${s}`)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-[13.5px] font-bold text-(--s-text)">{t("detail.description")}</h3>
                <p className="whitespace-pre-line text-[13.5px] leading-[1.8] text-pretty text-(--s-body)">
                  {item.description || t("detail.noDescription")}
                </p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
