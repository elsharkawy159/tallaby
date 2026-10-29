"use client";

import { CalendarDays, Link2, Rocket, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@workspace/ui/components/sheet";
import { cn } from "@/lib/utils";
import { CategoryChip, StatusPill, VoteButton } from "./roadmap-board.client";
import { statusStep } from "./roadmap.lib";
import { formatRoadmapDate, STATUS_STYLE } from "./roadmap-style.lib";
import { ROADMAP_STATUSES, type RoadmapItem } from "./roadmap.types";

/** Task pane that slides in from the reading end, like a task manager's detail view. */
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
      <SheetContent
        side={locale === "ar" ? "left" : "right"}
        className="w-full gap-0 overflow-y-auto p-0 sm:max-w-[480px]"
      >
        {item && (
          <>
            <div className="flex items-center gap-2 border-b border-border px-5 py-4 pe-12">
              <StatusPill status={item.status} />
              <CategoryChip category={item.category} />
              <button
                type="button"
                onClick={copyLink}
                aria-label={t("detail.copyLink")}
                className="ms-auto grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Link2 className="size-4" />
              </button>
            </div>

            <div className="flex flex-col gap-6 px-5 py-5">
              <div className="flex items-start gap-3.5">
                <VoteButton item={item} onVote={onVote} size="lg" />
                <div className="min-w-0">
                  <SheetTitle className="text-lg font-bold leading-relaxed text-pretty text-foreground">
                    {item.title}
                  </SheetTitle>
                  <SheetDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Store className="size-3.5" />
                      {item.author ?? t("team")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {t("detail.added", { date: formatRoadmapDate(item.createdAt, locale) })}
                    </span>
                    {item.launchedAt && (
                      <span className="inline-flex items-center gap-1">
                        <Rocket className="size-3.5" />
                        {t("detail.launchedOn", { date: formatRoadmapDate(item.launchedAt, locale) })}
                      </span>
                    )}
                  </SheetDescription>
                </div>
              </div>

              {/* Asana-style field rows */}
              <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-3 text-sm">
                <dt className="text-muted-foreground">{t("list.status")}</dt>
                <dd>
                  <StatusPill status={item.status} />
                </dd>
                <dt className="text-muted-foreground">{t("list.category")}</dt>
                <dd>
                  <CategoryChip category={item.category} />
                </dd>
                <dt className="text-muted-foreground">{t("detail.suggestedBy")}</dt>
                <dd className="truncate font-medium text-foreground">{item.author ?? t("team")}</dd>
                <dt className="text-muted-foreground">{t("list.votes")}</dt>
                <dd className="text-foreground">
                  {t("detail.voters", { count: item.votes })}
                  {item.voted && <span className="text-muted-foreground"> · {t("detail.youVoted")}</span>}
                </dd>
              </dl>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">{t("detail.progress")}</h4>
                <div className="flex gap-1.5">
                  {ROADMAP_STATUSES.map((s, k) => (
                    <span
                      key={s}
                      className={cn("h-1.5 flex-1 rounded-full", k <= step ? STATUS_STYLE[item.status].bar : "bg-border")}
                    />
                  ))}
                </div>
                <div className="mt-1.5 grid grid-cols-4 gap-1.5 text-[11.5px] text-muted-foreground">
                  {ROADMAP_STATUSES.map((s, k) => (
                    <span key={s} className={cn("truncate", k === step && "font-semibold text-foreground")}>
                      {t(`status.${s}`)}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-foreground">{t("detail.description")}</h4>
                <p className="whitespace-pre-line text-sm leading-relaxed text-pretty text-foreground/90">
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
