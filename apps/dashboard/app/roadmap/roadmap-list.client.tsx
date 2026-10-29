"use client";

import { useState } from "react";
import { ChevronDown, Store } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CategoryChip, StatusPill, VoteButton } from "./roadmap-board.client";
import { formatRoadmapDate, STATUS_STYLE } from "./roadmap-style.lib";
import { ROADMAP_STATUSES, type RoadmapItem, type RoadmapStatus } from "./roadmap.types";

/** Asana-style list: one collapsible section per stage, one row per idea. */
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
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      {/* Column headings (desktop only; rows stack on phones). */}
      <div className="hidden grid-cols-[56px_minmax(0,1fr)_140px_130px_110px] items-center gap-3 border-b border-border bg-muted/40 px-4 py-2.5 text-xs font-semibold text-muted-foreground md:grid">
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
          <section key={status} className="border-b border-border last:border-b-0">
            <button
              type="button"
              onClick={() => setCollapsed((c) => ({ ...c, [status]: !isCollapsed }))}
              aria-expanded={!isCollapsed}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-start transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
            >
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  isCollapsed && "-rotate-90 rtl:rotate-90",
                )}
              />
              <span className={cn("grid size-7 place-items-center rounded-lg", s.tone)}>
                <Icon className="size-3.5" />
              </span>
              <span className="text-sm font-bold text-foreground">{t(`status.${status}`)}</span>
              <span className="grid h-5 min-w-[22px] place-items-center rounded-full border border-border bg-background px-1.5 font-montserrat text-[11px] font-semibold tabular-nums">
                {list.length}
              </span>
              <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                {t(`statusHint.${status}`)}
              </span>
            </button>

            {!isCollapsed &&
              (list.length ? (
                <ul>
                  {list.map((item) => (
                    <li key={item.id} className="border-t border-border/70">
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
                        className="grid cursor-pointer grid-cols-[48px_minmax(0,1fr)] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50 md:grid-cols-[56px_minmax(0,1fr)_140px_130px_110px]"
                      >
                        <div className="flex justify-center">
                          <VoteButton item={item} onVote={onVote} size="sm" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <Store className="size-3 shrink-0" />
                            <span className="truncate">{item.author ?? t("team")}</span>
                            {item.mine && (
                              <span className="ms-1 rounded-full bg-accent-soft px-2 text-[11px] font-medium text-accent-ink">
                                {t("yours")}
                              </span>
                            )}
                          </p>
                          {/* Phone: category + status under the title. */}
                          <div className="mt-1.5 flex flex-wrap gap-1.5 md:hidden">
                            <CategoryChip category={item.category} />
                          </div>
                        </div>
                        <div className="hidden md:block">
                          <CategoryChip category={item.category} />
                        </div>
                        <div className="hidden md:block">
                          <StatusPill status={item.status} />
                        </div>
                        <span className="hidden font-montserrat text-xs tabular-nums text-muted-foreground md:block">
                          {formatRoadmapDate(item.launchedAt ?? item.createdAt, locale)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-t border-border/70 px-4 py-4 text-center text-[13px] text-muted-foreground">
                  {filtered ? t("noResults") : t(`emptyColumn.${status}`)}
                </p>
              ))}
          </section>
        );
      })}
    </div>
  );
}
