"use client";

import { Check, ChevronUp, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { canVote } from "./roadmap.lib";
import { formatRoadmapDate, STATUS_STYLE } from "./roadmap-style.lib";
import { ROADMAP_STATUSES, type RoadmapItem, type RoadmapStatus } from "./roadmap.types";

export function VoteButton({
  item,
  onVote,
  size = "md",
}: {
  item: RoadmapItem;
  onVote: (item: RoadmapItem) => void;
  size?: "sm" | "md" | "lg";
}) {
  const t = useTranslations("roadmap");
  const open = canVote(item.status);
  const Icon = item.status === "launched" ? Check : ChevronUp;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onVote(item);
      }}
      disabled={!open}
      aria-pressed={item.voted}
      aria-label={`${item.voted ? t("voted") : t("vote")} · ${t("voteCount", { count: item.votes })}`}
      title={open ? undefined : t("votesClosed")}
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-[10px] border transition-colors focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        size === "sm" && "h-9 w-12 flex-row gap-1",
        size === "md" && "h-14 w-12",
        size === "lg" && "h-16 w-14",
        item.voted
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary-ink",
        !open && !item.voted && "cursor-default bg-muted/50 hover:border-border hover:text-muted-foreground",
        !open && item.voted && "cursor-default",
      )}
    >
      <Icon className={cn(size === "sm" ? "size-3.5" : "size-4")} strokeWidth={2.4} />
      <span
        className={cn(
          "font-montserrat font-bold tabular-nums leading-tight",
          size === "sm" ? "text-xs" : "text-sm",
          !item.voted && "text-foreground",
        )}
      >
        {item.votes}
      </span>
    </button>
  );
}

export function CategoryChip({ category, className }: { category: RoadmapItem["category"]; className?: string }) {
  const t = useTranslations("roadmap.categories");
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-full bg-primary-soft px-2.5 text-[11.5px] font-medium text-primary-ink",
        className,
      )}
    >
      {t(category)}
    </span>
  );
}

export function StatusPill({ status, className }: { status: RoadmapStatus; className?: string }) {
  const t = useTranslations("roadmap.status");
  const s = STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold",
        s.tone,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {t(status)}
    </span>
  );
}

function RoadmapCard({
  item,
  onOpen,
  onVote,
}: {
  item: RoadmapItem;
  onOpen: (item: RoadmapItem) => void;
  onVote: (item: RoadmapItem) => void;
}) {
  const t = useTranslations("roadmap");
  const locale = useLocale();
  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(item);
        }
      }}
      className="group flex cursor-pointer gap-3 rounded-xl border border-border bg-card p-3 text-start shadow-[0_1px_2px_rgba(20,81,99,0.05)] transition-[border-color,transform,box-shadow] hover:-translate-y-px hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      <VoteButton item={item} onVote={onVote} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-sm font-semibold leading-relaxed text-pretty text-foreground">{item.title}</h3>
        {item.description && (
          <p className="line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">{item.description}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <CategoryChip category={item.category} />
          {item.mine && (
            <span className="inline-flex h-[22px] items-center rounded-full bg-accent-soft px-2.5 text-[11.5px] font-medium text-accent-ink">
              {t("yours")}
            </span>
          )}
          <span className="inline-flex min-w-0 items-center gap-1">
            <Store className="size-3 shrink-0" />
            <span className="truncate">{item.author ?? t("team")}</span>
          </span>
          {item.launchedAt && (
            <span className="ms-auto font-montserrat tabular-nums">{formatRoadmapDate(item.launchedAt, locale)}</span>
          )}
        </div>
      </div>
    </article>
  );
}

export function RoadmapBoard({
  items,
  filtered,
  onOpen,
  onVote,
}: {
  items: RoadmapItem[];
  filtered: boolean;
  onOpen: (item: RoadmapItem) => void;
  onVote: (item: RoadmapItem) => void;
}) {
  const t = useTranslations("roadmap");
  return (
    // Below lg the columns scroll sideways with snap points, like a task board on a phone.
    <div className="-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-4 [scrollbar-width:thin] sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:snap-none lg:grid-cols-4 lg:overflow-visible lg:px-0">
      {ROADMAP_STATUSES.map((status) => {
        const list = items.filter((i) => i.status === status);
        const s = STATUS_STYLE[status];
        const Icon = s.icon;
        return (
          <section
            key={status}
            aria-label={t(`status.${status}`)}
            className="flex w-[84vw] max-w-[340px] shrink-0 snap-start flex-col self-start rounded-2xl border border-border bg-muted/40 sm:w-[320px] lg:w-auto lg:max-w-none"
          >
            <header className="flex items-start gap-2.5 p-3.5 pb-3">
              <span className={cn("grid size-[34px] shrink-0 place-items-center rounded-[10px]", s.tone)}>
                <Icon className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold leading-normal text-foreground">{t(`status.${status}`)}</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">{t(`statusHint.${status}`)}</p>
              </div>
              <span className="ms-auto grid h-6 min-w-[26px] place-items-center rounded-full border border-border bg-card px-2 font-montserrat text-xs font-semibold tabular-nums">
                {list.length}
              </span>
            </header>
            <div className={cn("h-0.5 mx-3.5 mb-3 rounded-full opacity-60", s.bar)} />
            {list.length ? (
              <div className="flex max-h-[calc(100dvh-220px)] flex-col gap-2.5 overflow-y-auto px-2.5 pb-2.5 [scrollbar-width:thin] lg:max-h-none lg:overflow-visible">
                {list.map((item) => (
                  <RoadmapCard key={item.id} item={item} onOpen={onOpen} onVote={onVote} />
                ))}
              </div>
            ) : (
              <div className="mx-2.5 mb-2.5 flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-border px-4 py-7 text-center text-muted-foreground">
                <span className={cn("grid size-11 place-items-center rounded-full", s.tone)}>
                  <Icon className="size-[18px]" />
                </span>
                <b className="text-sm font-semibold text-foreground">{t("emptyTitle")}</b>
                <small className="text-[12.5px] leading-relaxed text-pretty">
                  {filtered ? t("noResults") : t(`emptyColumn.${status}`)}
                </small>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
