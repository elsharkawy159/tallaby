"use client";

import * as React from "react";
import { Search, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Chip, ChipRow } from "@/components/marketing/site/chips";
import { ForwardArrow } from "@/components/marketing/site/direction-icons";
import { filterHubItems, hubCategoryCounts } from "@/lib/marketing/hub.lib";
import { cn } from "@workspace/ui/lib/utils";

export type HubCardItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  /** Extra words the search matches, such as a Latin brand name. */
  keywords?: string;
  soon?: boolean;
  /** Set only when a detail page exists: no link, no arrow. */
  href?: string;
  featured?: boolean;
  /** The card's picture, rendered on the server. */
  mark: React.ReactNode;
};

type Labels = {
  search: string;
  searchPlaceholder: string;
  categories: string;
  soon: string;
  featured: string;
  featuredCta: string;
  /** `{count}` is replaced with the visible number of items. */
  count: string;
  noneTitle: string;
  noneBody: string;
};

function Card({ item, soonLabel }: { item: HubCardItem; soonLabel: string }) {
  const body = (
    <>
      <div className="flex flex-none flex-wrap items-start justify-between gap-2 min-[561px]:w-full">
        {item.mark}
        {item.soon ? (
          <span className="rounded-full border border-dashed border-[#c9d6d9] bg-white px-2.5 py-px text-xs font-bold text-ink-500">{soonLabel}</span>
        ) : (
          <span className="hidden rounded-full bg-[#f3f6f7] px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-ink-500 min-[561px]:inline">{item.categoryLabel}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <b className="flex items-center justify-between gap-2 text-[16.5px] leading-[1.45] text-teal-900">
          <bdi>{item.name}</bdi>
          {item.href ? <ForwardArrow className="flex-none text-teal-500" /> : null}
        </b>
        <p className="mt-0.5 text-sm text-pretty text-ink-500">{item.description}</p>
      </div>
    </>
  );
  const box = "flex flex-row flex-wrap items-center gap-x-3.5 gap-y-1.5 rounded-[22px] border border-line bg-white p-4 min-[561px]:flex-col min-[561px]:items-stretch min-[561px]:gap-3 min-[561px]:p-5";
  if (item.href) {
    return (
      <Link
        href={item.href}
        className={cn(box, "text-inherit transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-[3px] hover:border-teal-300 hover:no-underline hover:shadow-[0_14px_32px_rgba(13,55,67,0.08)] motion-reduce:hover:translate-y-0")}
      >
        {body}
      </Link>
    );
  }
  return <div className={cn(box, item.soon && "bg-[#fbfcfc]")}>{body}</div>;
}

function FeaturedCard({ item, labels }: { item: HubCardItem; labels: Labels }) {
  const content = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {item.mark}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-[3px] text-xs font-bold text-[#7a4a00]">
          <Star className="size-[13px]" aria-hidden />
          {labels.featured}
        </span>
      </div>
      <div>
        <h3 className="text-[21px] leading-[1.4] font-bold text-teal-900">
          <bdi>{item.name}</bdi>
        </h3>
        <p className="text-[15px] text-pretty text-[#4d5f64]">{item.description}</p>
      </div>
      {item.href ? (
        <span className="mt-auto inline-flex items-center gap-1.5 text-[15px] font-bold text-teal-700">
          {labels.featuredCta}
          <ForwardArrow />
        </span>
      ) : null}
    </>
  );
  const box =
    "relative flex snap-center flex-col gap-3.5 overflow-hidden rounded-card-lg border border-teal-100 bg-gradient-to-b from-white to-[#f3f8f9] p-5 text-inherit shadow-[0_18px_44px_rgba(13,55,67,0.08)] min-[901px]:p-[26px]";
  return item.href ? (
    <Link href={item.href} className={cn(box, "transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:no-underline hover:shadow-[0_24px_56px_rgba(13,55,67,0.12)] motion-reduce:hover:translate-y-0")}>
      {content}
    </Link>
  ) : (
    <div className={box}>{content}</div>
  );
}

/**
 * The hub's search box with its `/` shortcut, category chips with counts,
 * featured cards and the grid. Featured cards only show on the unfiltered
 * view, where they aren't repeated in the grid.
 */
export function HubListing({
  items,
  categories,
  labels,
}: {
  items: HubCardItem[];
  categories: { id: string; label: string }[];
  labels: Labels;
}) {
  const [category, setCategory] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toUpperCase();
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const list = filterHubItems(items, category, query);
  const counts = hubCategoryCounts(items);
  const showFeatured = category === "all" && !query.trim();
  const featured = showFeatured ? items.filter((item) => item.featured) : [];
  const grid = showFeatured ? list.filter((item) => !item.featured) : list;

  return (
    <>
      <label className="mx-auto mt-[30px] flex h-[54px] max-w-[600px] items-center gap-2.5 rounded-full border-[1.5px] border-line-strong bg-white px-[22px] text-ink-400 shadow-[0_10px_30px_rgba(20,81,99,0.08)] transition-[border-color,box-shadow] duration-150 focus-within:border-teal-700 focus-within:shadow-[var(--ring-focus)] min-[561px]:h-[60px]">
        <Search className="size-5 flex-none" aria-hidden />
        <span className="sr-only">{labels.search}</span>
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={labels.searchPlaceholder}
          className="h-full min-w-0 flex-1 bg-transparent text-[16.5px] text-teal-900 outline-none"
        />
        <kbd aria-hidden className="hidden rounded-md border border-neutral-200 px-2 py-0.5 font-latin text-xs font-semibold text-neutral-500 sm:block">
          /
        </kbd>
      </label>

      <div className="pt-12 pb-14">
        <div className="mb-6 flex min-w-0 items-center justify-between gap-4">
          <ChipRow role="toolbar" aria-label={labels.categories} className="min-w-0 flex-1 text-start">
            {categories.map((c) => (
              <Chip key={c.id} selected={c.id === category} onClick={() => setCategory(c.id)}>
                {c.label}
                <span className="ms-1.5 font-latin text-xs font-semibold opacity-60">{c.id === "all" ? items.length : (counts[c.id] ?? 0)}</span>
              </Chip>
            ))}
          </ChipRow>
          <span aria-live="polite" className="hidden text-sm whitespace-nowrap text-ink-500 min-[901px]:block">
            {labels.count.replace("{count}", String(list.length))}
          </span>
        </div>

        {featured.length ? (
          <div className="-mx-4 mb-10 grid auto-cols-[82%] grid-flow-col gap-[18px] overflow-x-auto scroll-smooth px-4 pt-1 pb-3 no-scrollbar [scroll-snap-type:x_mandatory] motion-reduce:scroll-auto sm:-mx-5 sm:px-5 min-[901px]:mx-0 min-[901px]:grid-flow-row min-[901px]:grid-cols-3 min-[901px]:overflow-visible min-[901px]:px-0 min-[901px]:pb-0">
            {featured.map((item) => (
              <FeaturedCard key={item.id} item={item} labels={labels} />
            ))}
          </div>
        ) : null}

        {list.length ? (
          <div className="grid gap-3.5 text-start min-[561px]:grid-cols-2 min-[901px]:grid-cols-3 min-[1101px]:grid-cols-4">
            {grid.map((item) => (
              <Card key={item.id} item={item} soonLabel={labels.soon} />
            ))}
          </div>
        ) : (
          <div className="rounded-[20px] border border-dashed border-neutral-300 p-12 text-center text-[#4d5f64]">
            <b className="mb-1 block text-lg text-teal-900">{labels.noneTitle}</b>
            {labels.noneBody}
          </div>
        )}
      </div>
    </>
  );
}
