"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  KanbanSquare,
  List,
  ListChecks,
  LogIn,
  Map as MapIcon,
  Plus,
  Search,
  Tag,
  ThumbsUp,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { LanguageToggle } from "@/components/layout/language-toggle.client";
import { ThemeToggle } from "@/components/layout/theme-toggle.client";
import { cn } from "@/lib/utils";
import { RoadmapBoard } from "./roadmap-board.client";
import { RoadmapDetail } from "./roadmap-detail.client";
import { SignInDialog, SuggestDialog } from "./roadmap-dialogs.client";
import { RoadmapList } from "./roadmap-list.client";
import { applyVote, filterItems } from "./roadmap.lib";
import { toggleFeatureVote } from "./roadmap.server";
import {
  ROADMAP_CATEGORIES,
  type RoadmapCategory,
  type RoadmapItem,
  type RoadmapSort,
  type RoadmapTab,
  type RoadmapView,
  type RoadmapViewer,
} from "./roadmap.types";

const VIEW_KEY = "tallaby-roadmap-view";
const HOW_KEY = "tallaby-roadmap-how-hidden";

function readPref(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writePref(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the preference just isn't remembered */
  }
}

export function RoadmapPage({
  initialItems,
  viewer,
  initialOpenId,
}: {
  initialItems: RoadmapItem[];
  viewer: RoadmapViewer;
  initialOpenId: string | null;
}) {
  const t = useTranslations("roadmap");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isSeller = viewer.kind === "seller";

  const [items, setItems] = useState(initialItems);
  const [view, setView] = useState<RoadmapView>("board");
  const [tab, setTab] = useState<RoadmapTab>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RoadmapCategory | "">("");
  const [sort, setSort] = useState<RoadmapSort>("votes");
  const [openId, setOpenId] = useState<string | null>(initialOpenId);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [howHidden, setHowHidden] = useState(false);
  const pendingVotes = useRef(new Set<string>());

  // Remembered per browser; read after mount so server and client render the same first frame.
  useEffect(() => {
    if (readPref(VIEW_KEY) === "list") setView("list");
    if (readPref(HOW_KEY) === "1") setHowHidden(true);
  }, []);

  const filtered = useMemo(
    () => filterItems(items, { query, category, tab, sort }),
    [items, query, category, tab, sort],
  );
  const isFiltering = Boolean(query || category || tab !== "all");
  const openItem = items.find((i) => i.id === openId) ?? null;

  const stats = useMemo(
    () => ({
      ideas: items.length,
      votes: items.reduce((n, i) => n + i.votes, 0),
      launched: items.filter((i) => i.status === "launched").length,
      mine: items.filter((i) => i.mine).length,
      voted: items.filter((i) => i.voted).length,
    }),
    [items],
  );

  // Keep ?idea=<id> in the address bar so a card can be shared.
  const setOpen = useCallback((id: string | null) => {
    setOpenId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("idea", id);
    else url.searchParams.delete("idea");
    window.history.replaceState(null, "", url);
  }, []);

  const onVote = useCallback(
    (item: RoadmapItem) => {
      if (!isSeller) {
        setSignInOpen(true);
        return;
      }
      if (pendingVotes.current.has(item.id)) return;
      pendingVotes.current.add(item.id);
      setItems((list) => applyVote(list, item.id));
      void toggleFeatureVote({ id: item.id })
        .then((result) => {
          if (!result.success) {
            setItems((list) => applyVote(list, item.id));
            if (result.error === "unauthorized") setSignInOpen(true);
            else toast.error(t(`toast.${result.error}`));
            return;
          }
          setItems((list) =>
            list.map((i) => (i.id === item.id ? { ...i, voted: result.data.voted, votes: result.data.votes } : i)),
          );
          toast.success(t(result.data.voted ? "toast.voted" : "toast.unvoted"));
        })
        .catch(() => {
          setItems((list) => applyVote(list, item.id));
          toast.error(t("toast.generic"));
        })
        .finally(() => pendingVotes.current.delete(item.id));
    },
    [isSeller, t],
  );

  const onSuggest = () => (isSeller ? setSuggestOpen(true) : setSignInOpen(true));
  const changeView = (next: RoadmapView) => {
    setView(next);
    writePref(VIEW_KEY, next);
  };
  const clearFilters = () => {
    setQuery("");
    setCategory("");
    setTab("all");
  };

  const BackIcon = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-dvh bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:h-16">
        <div className="mx-auto flex h-full max-w-[1320px] items-center gap-2 px-4 sm:px-6">
          {isSeller ? (
            <Link
              href="/"
              className="inline-flex h-9 items-center gap-2 rounded-[10px] px-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <BackIcon className="size-[18px]" />
              <span className="hidden sm:inline">{t("backToDashboard")}</span>
            </Link>
          ) : null}
          <Image
            src="/logo-word.png"
            alt="Tallaby"
            width={112}
            height={28}
            priority
            className={cn(
              "h-6 w-auto object-contain dark:brightness-0 dark:invert sm:h-7",
              isSeller && "hidden min-[420px]:block",
            )}
          />
          <div className="ms-auto flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            {viewer.kind === "guest" && (
              <Link
                href="/login?next=/roadmap"
                className="ms-1 inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-primary px-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                <LogIn className="size-4 rtl:-scale-x-100" />
                <span className="hidden min-[380px]:inline">{t("signIn")}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-4 pb-24 pt-6 sm:px-6 sm:pt-8">
        {/* Project header */}
        <section className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-sm sm:size-14">
              <MapIcon className="size-6 text-accent" />
            </span>
            <div className="min-w-0">
              <h1 className="text-[22px] font-bold leading-snug sm:text-[26px]">{t("projectName")}</h1>
              <p className="mt-1 max-w-[640px] text-sm leading-relaxed text-pretty text-muted-foreground">
                {t("projectSubtitle")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                <span>
                  <b className="font-montserrat font-bold tabular-nums text-foreground">{stats.ideas}</b> {t("stats.ideas")}
                </span>
                <span>
                  <b className="font-montserrat font-bold tabular-nums text-foreground">{stats.votes}</b> {t("stats.votes")}
                </span>
                <span>
                  <b className="font-montserrat font-bold tabular-nums text-success">{stats.launched}</b>{" "}
                  {t("stats.launched")}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onSuggest}
            className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#f2a420] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 md:w-auto"
          >
            <Plus className="size-[18px]" />
            {t("suggest")}
          </button>
        </section>

        {/* How it works */}
        {!howHidden && (
          <section className="relative mt-6 rounded-2xl bg-primary p-4 pe-10 text-white dark:bg-[#11353f] sm:p-5 sm:pe-12">
            <button
              type="button"
              onClick={() => {
                setHowHidden(true);
                writePref(HOW_KEY, "1");
              }}
              aria-label={tCommon("close")}
              className="absolute end-2.5 top-2.5 grid size-8 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
            <h2 className="mb-3 text-sm font-semibold text-white/90">{t("howTitle")}</h2>
            <ol className="grid gap-3 sm:grid-cols-3">
              {(["suggest", "vote", "follow"] as const).map((key, i) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent font-montserrat text-[13px] font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <b className="block text-sm font-semibold">{t(`how.${key}.title`)}</b>
                    <small className="block text-[12.5px] leading-relaxed text-white/75">{t(`how.${key}.body`)}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* View tabs (Asana-style underline) */}
        <div className="mt-6 flex items-end gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]">
          {(
            [
              ["board", KanbanSquare],
              ["list", List],
            ] as const
          ).map(([key, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeView(key)}
              aria-pressed={view === key}
              className={cn(
                "-mb-px inline-flex h-10 items-center gap-2 border-b-2 px-3 text-sm font-medium transition-colors",
                view === key
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {t(`views.${key}`)}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isSeller && (
            <div className="flex w-full gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 [scrollbar-width:none] sm:w-auto">
              {(
                [
                  ["all", null, null],
                  ["mine", ListChecks, stats.mine],
                  ["voted", ThumbsUp, stats.voted],
                ] as const
              ).map(([key, Icon, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  aria-pressed={tab === key}
                  className={cn(
                    "inline-flex h-8 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-[13px] font-medium transition-colors sm:flex-none",
                    tab === key
                      ? "bg-primary-soft font-semibold text-primary-ink"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {Icon && <Icon className="size-3.5" />}
                  {t(`tabs.${key}`)}
                  {count != null && (
                    <span className="grid h-[18px] min-w-5 place-items-center rounded-full border border-border bg-background px-1 font-montserrat text-[10.5px] tabular-nums">
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[10px] border border-border bg-card px-3 text-muted-foreground focus-within:border-primary focus-within:ring-[3px] focus-within:ring-ring/30 sm:max-w-[300px] sm:flex-initial sm:basis-[260px] lg:ms-auto">
            <Search className="size-4 shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("filters.search")}
              aria-label={t("filters.search")}
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </label>

          <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : (v as RoadmapCategory))}>
            <SelectTrigger className="h-10 w-auto min-w-[150px] gap-2 rounded-[10px] bg-card" aria-label={t("filters.category")}>
              <Tag className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.allCategories")}</SelectItem>
              {ROADMAP_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {t(`categories.${c}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as RoadmapSort)}>
            <SelectTrigger className="h-10 w-auto min-w-[150px] gap-2 rounded-[10px] bg-card" aria-label={t("filters.sort")}>
              <ArrowUpDown className="size-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes">{t("filters.sortVotes")}</SelectItem>
              <SelectItem value="new">{t("filters.sortNew")}</SelectItem>
            </SelectContent>
          </Select>

          {isFiltering && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-3.5" />
              {t("filters.clear")}
            </button>
          )}
        </div>

        <div className="mt-4">
          {view === "board" ? (
            <RoadmapBoard items={filtered} filtered={isFiltering} onOpen={(i) => setOpen(i.id)} onVote={onVote} />
          ) : (
            <RoadmapList items={filtered} filtered={isFiltering} onOpen={(i) => setOpen(i.id)} onVote={onVote} />
          )}
        </div>
      </main>

      <RoadmapDetail item={openItem} onClose={() => setOpen(null)} onVote={onVote} />
      <SuggestDialog
        open={suggestOpen}
        onOpenChange={setSuggestOpen}
        items={items}
        onCreated={(item) => {
          setItems((list) => [item, ...list]);
          setOpen(item.id);
        }}
        onOpenItem={(item) => setOpen(item.id)}
      />
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} viewer={viewer} />
    </div>
  );
}
