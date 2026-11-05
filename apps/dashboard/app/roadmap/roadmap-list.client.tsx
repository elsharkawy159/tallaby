"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CategoryChip, StatusPill, VoteButton, YoursTag } from "./roadmap-board.client";
import { formatRoadmapDate, STATUS_STYLE } from "./roadmap-style.lib";
import { ROADMAP_STATUSES, type RoadmapItem, type RoadmapStatus } from "./roadmap.types";

const ROW_GRID = "min-[721px]:grid-cols-[56px_minmax(0,1fr)_140px_130px_110px]";

/** The list view, which the design doesn't have: one collapsible section per stage, one row per idea, in its row list look. */
export function RoadmapList({
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
  const locale = useLocale();
  const [collapsed, setCollapsed] = useState<Partial<Record<RoadmapStatus, boolean>>>({});

  return (
    <div className="overflow-hidden rounded-[20px] border border-(--s-line) bg-(--s-surface)">
      {/* Column headings (wide screens only; rows stack on phones). */}
      <div
        className={cn(
          "hidden items-center gap-3 border-b border-(--s-line) bg-(--s-surface-2) px-4 py-2.5 text-xs font-semibold text-(--s-subtle) min-[721px]:grid",
          ROW_GRID,
        )}
      >
        <span className="text-center">{t("list.votes")}</span>
        <span>{t("list.title")}</span>
        <span>{t("list.category")}</span>
        <span>{t("list.status")}</span>
        <span>{t("list.date")}</span>
      </div>

      {ROADMAP_STATUSES.map((status) => {
        const list = items.filter((i) => i.status === status);
        const s = STATUS_STYLE[status];
        const Icon = s.icon;
        const isCollapsed = collapsed[status] ?? false;
        return (
          <section key={status} className="border-b border-(--s-line) last:border-b-0">
            <button
              type="button"
              onClick={() => setCollapsed((c) => ({ ...c, [status]: !isCollapsed }))}
              aria-expanded={!isCollapsed}
              className="flex min-h-12 w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-start transition-colors duration-150 hover:bg-(--s-tint)"
            >
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-(--s-subtle) transition-transform duration-150",
                  isCollapsed && "-rotate-90 rtl:rotate-90",
                )}
              />
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-lg", s.tone, status === "waiting" && "bg-(--s-fill)")}>
                <Icon className="size-3.5" />
              </span>
              <span className="text-sm font-bold text-(--s-ink)">{t(`status.${status}`)}</span>
              <span className="rounded-full bg-(--s-fill) px-2 py-px font-montserrat text-[11px] font-bold tabular-nums text-(--s-muted)">
                {list.length}
              </span>
              <span className="truncate text-xs text-(--s-subtle) max-[600px]:hidden">{t(`statusHint.${status}`)}</span>
            </button>

            {!isCollapsed &&
              (list.length ? (
                <ul>
                  {list.map((item) => (
                    <li key={item.id} className="border-t border-(--s-line-soft)">
                      <div
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
                          "grid cursor-pointer grid-cols-[48px_minmax(0,1fr)] items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-(--s-tint)",
                          ROW_GRID,
                        )}
                      >
                        <div className="flex justify-center">
                          <VoteButton item={item} onVote={onVote} size="sm" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[13.5px] font-bold text-(--s-text)">{item.title}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-(--s-subtle)">
                            {item.mine ? (
                              <YoursTag className="text-[11px]" />
                            ) : (
                              <span className="truncate">{item.author === null ? t("team") : item.author}</span>
                            )}
                          </p>
                          {/* Phone: the category under the title. */}
                          <div className="mt-1.5 flex flex-wrap gap-1.5 min-[721px]:hidden">
                            <CategoryChip category={item.category} />
                          </div>
                        </div>
                        <div className="max-[720px]:hidden">
                          <CategoryChip category={item.category} />
                        </div>
                        <div className="max-[720px]:hidden">
                          <StatusPill status={item.status} />
                        </div>
                        <span className="font-montserrat text-xs tabular-nums text-(--s-subtle) max-[720px]:hidden">
                          {formatRoadmapDate(item.launchedAt ?? item.createdAt, locale)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-t border-(--s-line-soft) px-4 py-4 text-center text-[13px] text-(--s-subtle)">
                  {filtered ? t("noResults") : t(`emptyColumn.${status}`)}
                </p>
              ))}
          </section>
        );
      })}
    </div>
  );
}
