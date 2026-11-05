"use client";

import { Check, ChevronUp, Rocket } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { canVote } from "./roadmap.lib";
import { formatRoadmapDate, STATUS_STYLE } from "./roadmap-style.lib";
import { ROADMAP_STATUSES, type RoadmapItem, type RoadmapStatus } from "./roadmap.types";

/** `.vb`: the count with an arrow. Solid once voted, dashed when voting has closed. */
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
  const Icon = item.voted || item.status === "launched" ? Check : ChevronUp;
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
        "flex shrink-0 cursor-pointer flex-col items-center justify-center self-start rounded-[14px] border-[1.5px] transition-colors duration-150",
        size === "sm" && "h-10 w-12 flex-row gap-1",
        size === "md" && "min-h-[52px] w-[46px] py-1.5",
        size === "lg" && "h-16 w-14",
        item.voted
          ? "border-(--s-solid) bg-(--s-solid) text-(--s-solid-fg)"
          : "border-(--s-field) bg-(--s-surface) text-(--s-body) hover:border-(--s-primary) hover:text-(--s-ink)",
        !open && "cursor-default border-dashed opacity-60 hover:border-(--s-field) hover:text-(--s-body)",
        !open && item.voted && "hover:border-(--s-solid) hover:text-(--s-solid-fg)",
      )}
    >
      <Icon className={cn(size === "sm" ? "size-3.5" : "size-4")} strokeWidth={2.2} />
      <span className={cn("font-montserrat font-bold tabular-nums leading-tight", size === "sm" ? "text-xs" : "text-[13px]")}>
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
        "inline-flex w-max items-center rounded-full bg-primary-soft px-[9px] py-px text-[11px] font-bold text-primary-ink",
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
        status === "waiting" && "bg-(--s-fill)",
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} />
      {t(status)}
    </span>
  );
}

/** The seller's "yours" mark (`.me`). */
export function YoursTag({ className }: { className?: string }) {
  const t = useTranslations("roadmap");
  return (
    <span className={cn("rounded-full bg-accent-soft px-2 font-bold text-accent-ink", className)}>{t("yours")}</span>
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
  const author = item.author === null ? t("team") : item.author;
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
      className={cn(
        "flex cursor-pointer gap-3 rounded-[18px] border border-(--s-line) bg-(--s-surface) p-3 text-start transition-[border-color,box-shadow] duration-150 hover:shadow-(--s-shadow-hover)",
        item.voted && "border-(--s-outline)",
      )}
    >
      <VoteButton item={item} onVote={onVote} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <CategoryChip category={item.category} />
        <h3 className="text-[13.5px] font-bold leading-[1.55] text-pretty text-(--s-text)">{item.title}</h3>
        {item.description && (
          <p className="line-clamp-2 text-[12.5px] leading-[1.7] text-(--s-muted)">{item.description}</p>
        )}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11.5px] text-(--s-faint)">
          {item.mine ? <YoursTag /> : author && <span className="min-w-0 truncate">{author}</span>}
          <span className="font-montserrat tabular-nums">· {formatRoadmapDate(item.createdAt, locale)}</span>
          {item.launchedAt && (
            <span className="inline-flex items-center gap-[3px] font-semibold text-success">
              <Rocket className="size-3" />
              <span className="font-montserrat tabular-nums">{formatRoadmapDate(item.launchedAt, locale)}</span>
            </span>
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
    // Four columns need 1140px; below that the board scrolls sideways inside itself and each column
    // scrolls on its own, so swiping to a short column never lands on empty space.
    <div className="grid snap-x snap-proximity grid-cols-[repeat(4,minmax(260px,1fr))] gap-3.5 overflow-x-auto pb-1.5 max-[1140px]:items-start max-[600px]:grid-cols-[repeat(4,86%)]">
      {ROADMAP_STATUSES.map((status) => {
        const list = items.filter((i) => i.status === status);
        const s = STATUS_STYLE[status];
        const Icon = s.icon;
        return (
          <section
            key={status}
            aria-label={t(`status.${status}`)}
            className="flex min-h-[300px] min-w-0 snap-start flex-col gap-2.5 rounded-[24px] border border-(--s-line) bg-(--s-fill) p-3"
          >
            <header className="flex items-start gap-2.5 px-1 pt-1 pb-1.5">
              <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", s.tone)}>
                <Icon className="size-[17px]" />
              </span>
              <div className="min-w-0">
                <h2 className="flex items-center gap-1.5 text-[14.5px] font-bold text-(--s-ink)">
                  {t(`status.${status}`)}
                  <span className="rounded-full bg-(--s-surface) px-2 py-px font-montserrat text-[11px] font-bold tabular-nums text-(--s-muted)">
                    {list.length}
                  </span>
                </h2>
                <p className="text-[11.5px] leading-[1.6] text-(--s-subtle)">{t(`statusHint.${status}`)}</p>
              </div>
            </header>
            {list.length ? (
              <div className="flex flex-col gap-2 [scrollbar-width:thin] max-[1140px]:max-h-[calc(100dvh-160px)] max-[1140px]:overflow-y-auto">
                {list.map((item) => (
                  <RoadmapCard key={item.id} item={item} onOpen={onOpen} onVote={onVote} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-(--s-field-strong) px-3.5 py-6 text-center text-[12.5px] text-(--s-subtle)">
                <Icon className="size-5 text-(--s-faint)" />
                <b className="font-semibold text-(--s-text)">{t("emptyTitle")}</b>
                <span className="text-pretty">{filtered ? t("noResults") : t(`emptyColumn.${status}`)}</span>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
