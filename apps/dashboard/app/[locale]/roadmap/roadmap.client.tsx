"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, KanbanSquare, Lightbulb, List, LogIn, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { NativeSelect, PageContainer, Segmented, SellerButton, TextAction } from "@/components/seller-ui";
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

/** `.sel3` */
const SELECT_CLASS = "h-[42px] w-auto min-w-0 cursor-pointer rounded-full text-[13px] font-semibold max-[600px]:flex-1";

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
    // seller-shell switches the design system on for this public page, which sits outside the (main) layout.
    <div className="seller-shell min-h-dvh overflow-x-clip bg-background text-(--s-body)">
      <header className="sticky top-0 z-30 h-[68px] border-b border-(--s-topbar-line) bg-(--s-topbar) backdrop-blur-[14px] backdrop-saturate-[1.4] max-[600px]:h-[60px]">
        <div className="mx-auto flex h-full max-w-[1360px] items-center gap-2 px-7 max-[1020px]:px-4 max-[600px]:px-3">
          {isSeller && (
            <Link
              href="/"
              className="inline-flex min-h-10 items-center gap-2 rounded-[11px] px-2 text-[13px] font-semibold text-(--s-muted) transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink)"
              aria-label={t("backToDashboard")}
            >
              <BackIcon className="size-[18px]" />
              <span className="max-[600px]:hidden">{t("backToDashboard")}</span>
            </Link>
          )}
          <Image
            src="/logo-word.png"
            alt="Tallaby"
            width={112}
            height={28}
            priority
            className={cn("h-7 w-auto object-contain dark:brightness-0 dark:invert", isSeller && "max-[420px]:hidden")}
          />
          <div className="ms-auto flex items-center gap-1 max-[1020px]:[&>button]:size-10">
            <LanguageToggle />
            <ThemeToggle />
            {viewer.kind === "guest" && (
              <SellerButton variant="solid" size="sm" asChild className="ms-1 max-[1020px]:h-10 max-[380px]:px-3">
                <Link href="/login?next=/roadmap" aria-label={t("signIn")}>
                  <LogIn className="rtl:-scale-x-100" />
                  <span className="max-[380px]:hidden">{t("signIn")}</span>
                </Link>
              </SellerButton>
            )}
          </div>
        </div>
      </header>

      <PageContainer>
        <section
          className={cn(
            "sui-rise relative grid items-center gap-6 overflow-hidden rounded-[28px] bg-(--s-setup) p-7 text-white before:pointer-events-none before:absolute before:inset-[-70%_-10%_auto_45%] before:h-[170%] before:bg-[radial-gradient(50%_50%_at_50%_40%,rgb(253_173_40/0.22),transparent_70%)] max-[900px]:grid-cols-1 max-[600px]:rounded-[24px] max-[600px]:px-[18px] max-[600px]:py-[22px]",
            !howHidden && "grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]",
          )}
        >
          <div className="relative flex flex-col items-start gap-2.5">
            <span className="text-[12.5px] font-bold text-accent">{t("projectName")}</span>
            <h1 className="text-[clamp(22px,2.8vw,30px)] font-bold leading-[1.35] text-white">{t("heroTitle")}</h1>
            <p className="max-w-[480px] text-sm text-pretty text-white/80">{t("projectSubtitle")}</p>
            <div className="mb-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/80">
              {(
                [
                  ["ideas", stats.ideas],
                  ["votes", stats.votes],
                  ["launched", stats.launched],
                ] as const
              ).map(([key, value]) => (
                <span key={key}>
                  <b className="font-montserrat font-bold tabular-nums text-white">{value}</b> {t(`stats.${key}`)}
                </span>
              ))}
            </div>
            <SellerButton onClick={onSuggest}>
              <Lightbulb />
              {t("suggest")}
            </SellerButton>
          </div>

          {!howHidden && (
            <div className="relative flex min-w-0 flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[13px] font-bold text-white/90">{t("howTitle")}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setHowHidden(true);
                    writePref(HOW_KEY, "1");
                  }}
                  aria-label={tCommon("close")}
                  className="-my-2 -me-2 grid size-10 cursor-pointer place-items-center rounded-[11px] text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-4" />
                </button>
              </div>
              <ol className="flex flex-col gap-2.5">
                {(["suggest", "vote", "follow"] as const).map((key, i) => (
                  <li
                    key={key}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-3.5 py-3"
                  >
                    <span className="grid size-[26px] shrink-0 place-items-center rounded-full bg-accent font-montserrat text-xs font-bold text-(--tallaby-teal-900)">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <b className="block text-sm font-bold">{t(`how.${key}.title`)}</b>
                      <span className="block text-[12.5px] text-white/75">{t(`how.${key}.body`)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        {/* Toolbar (`.rbar`) */}
        <div className="sui-rise flex flex-wrap items-center gap-2 [animation-delay:.05s]">
          {isSeller && (
            <Segmented
              solid
              value={tab}
              onChange={setTab}
              label={t("filters.show")}
              className="border border-(--s-field) bg-(--s-surface) max-[1020px]:[&>button]:h-10 max-[600px]:flex max-[600px]:w-full"
              options={(
                [
                  ["all", null],
                  ["mine", stats.mine],
                  ["voted", stats.voted],
                ] as const
              ).map(([key, count]) => ({
                value: key,
                label: (
                  <>
                    {t(`tabs.${key}`)}
                    {count != null && (
                      <em className="ms-1 font-montserrat text-[10.5px] font-bold not-italic tabular-nums opacity-70">{count}</em>
                    )}
                  </>
                ),
              }))}
            />
          )}

          <Segmented
            solid
            value={view}
            onChange={changeView}
            label={t("views.label")}
            className="border border-(--s-field) bg-(--s-surface) max-[1020px]:[&>button]:h-10 max-[600px]:flex max-[600px]:w-full"
            options={(
              [
                ["board", KanbanSquare],
                ["list", List],
              ] as const
            ).map(([key, Icon]) => ({
              value: key,
              label: (
                <span className="inline-flex items-center justify-center gap-1.5">
                  <Icon className="size-3.5" />
                  {t(`views.${key}`)}
                </span>
              ),
            }))}
          />

          <label className="ms-auto flex h-[42px] min-w-0 flex-[1_1_200px] items-center gap-2 rounded-full border-[1.5px] border-(--s-field) bg-(--s-surface) px-3.5 text-(--s-subtle) transition-colors duration-150 focus-within:border-(--s-primary) min-[901px]:max-w-[320px] max-[900px]:order-first max-[900px]:ms-0 max-[900px]:basis-full">
            <Search className="size-4 shrink-0" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("filters.search")}
              aria-label={t("filters.search")}
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-(--s-text) outline-none placeholder:text-(--s-placeholder)"
            />
          </label>

          <NativeSelect
            value={category}
            onChange={(e) => setCategory(e.target.value as RoadmapCategory | "")}
            aria-label={t("filters.category")}
            className={SELECT_CLASS}
          >
            <option value="">{t("filters.allCategories")}</option>
            {ROADMAP_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`categories.${c}`)}
              </option>
            ))}
          </NativeSelect>

          <NativeSelect
            value={sort}
            onChange={(e) => setSort(e.target.value as RoadmapSort)}
            aria-label={t("filters.sort")}
            className={SELECT_CLASS}
          >
            <option value="votes">{t("filters.sortVotes")}</option>
            <option value="new">{t("filters.sortNew")}</option>
          </NativeSelect>

          {isFiltering && (
            <TextAction onClick={clearFilters} className="min-h-10 font-semibold">
              <X />
              {t("filters.clear")}
            </TextAction>
          )}
        </div>

        <div className="sui-rise [animation-delay:.1s]">
          {view === "board" ? (
            <RoadmapBoard items={filtered} filtered={isFiltering} onOpen={(i) => setOpen(i.id)} onVote={onVote} />
          ) : (
            <RoadmapList items={filtered} filtered={isFiltering} onOpen={(i) => setOpen(i.id)} onVote={onVote} />
          )}
        </div>
      </PageContainer>

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
        onVote={onVote}
      />
      <SignInDialog open={signInOpen} onOpenChange={setSignInOpen} viewer={viewer} />
    </div>
  );
}
