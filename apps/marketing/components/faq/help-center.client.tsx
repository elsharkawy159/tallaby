"use client";

import * as React from "react";
import { BadgePercent, CreditCard, Globe, Palette, Rocket, Search, Truck } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { FaqAccordion } from "@/components/site/faq-accordion";
import { useScrollSpy } from "@/components/site/use-scroll-spy.client";

const GROUPS = [
  { id: "start", icon: Rocket },
  { id: "pricing", icon: BadgePercent },
  { id: "payments", icon: CreditCard },
  { id: "shipping", icon: Truck },
  { id: "design", icon: Palette },
  { id: "domain", icon: Globe },
] as const;

type GroupId = (typeof GROUPS)[number]["id"];
type QA = { q: string; a: string };

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wraps matches of `query` in <mark>. */
function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "gi"));
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded-[3px] bg-amber-100 px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

/** Search box for the FAQ hero. Lives in the hero, shares state through context. */
const HelpQuery = React.createContext<{ query: string; setQuery: (q: string) => void; group: GroupId | null; setGroup: (g: GroupId | null) => void }>({
  query: "",
  setQuery: () => {},
  group: null,
  setGroup: () => {},
});

export function HelpCenterProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = React.useState("");
  const [group, setGroup] = React.useState<GroupId | null>(null);
  const value = React.useMemo(() => ({ query, setQuery, group, setGroup }), [query, group]);
  return <HelpQuery.Provider value={value}>{children}</HelpQuery.Provider>;
}

export function HelpSearch() {
  const t = useTranslations("faq");
  const { query, setQuery, setGroup } = React.useContext(HelpQuery);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const popular = t.raw("popularTerms") as string[];

  // "/" focuses the search, as in the design.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <label className="mx-auto mt-8 flex h-16 max-w-[640px] items-center gap-2.5 rounded-[18px] bg-white px-[18px] text-neutral-600 shadow-[0_14px_40px_rgba(0,0,0,0.25)]">
        <Search className="size-5" aria-hidden />
        <span className="sr-only">{t("search")}</span>
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("placeholder")}
          className="h-full min-w-0 flex-1 bg-transparent text-[17px] text-teal-900 outline-none"
        />
        <kbd className="hidden rounded-md border border-neutral-200 px-2 py-0.5 font-latin text-xs font-semibold text-neutral-500 sm:inline">/</kbd>
      </label>
      <div className="mt-[18px] flex flex-wrap justify-center gap-2 text-[13px] text-haze">
        <span>{t("popular")}</span>
        {popular.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setQuery(term);
              setGroup(null);
            }}
            className="rounded-full bg-white/10 px-3.5 py-[5px] text-[13px] text-white hover:bg-white/15"
          >
            {term}
          </button>
        ))}
      </div>
    </>
  );
}

/** Category tiles (overlapping the hero), table of contents and the grouped questions. */
export function HelpResults({ still }: { still: React.ReactNode }) {
  const t = useTranslations("faq");
  const { query, group, setGroup } = React.useContext(HelpQuery);
  const q = query.trim();
  const active = useScrollSpy(GROUPS.map((g) => g.id), 120);

  const groups = GROUPS.filter((g) => !group || g.id === group).map((g) => {
    const items = (t.raw(`groups.${g.id}.items`) as QA[]).filter(
      (x) => !q || `${x.q} ${x.a}`.toLowerCase().includes(q.toLowerCase()),
    );
    return { ...g, items };
  });
  const total = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <>
      <div className="relative -mt-[70px] grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {GROUPS.slice(0, 4).map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={group === g.id}
            onClick={() => setGroup(group === g.id ? null : g.id)}
            className="group grid gap-1 rounded-[20px] border border-neutral-200 bg-white p-[22px] text-start shadow-soft transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-teal-300 aria-pressed:border-teal-900 aria-pressed:shadow-[0_0_0_1px_var(--color-teal-900)]"
          >
            <span className="mb-2 grid size-[42px] place-items-center rounded-xl bg-teal-50 text-teal-700 group-aria-pressed:bg-amber-600 group-aria-pressed:text-teal-900">
              <g.icon className="size-[18px]" aria-hidden />
            </span>
            <b className="text-base text-teal-900">{t(`groups.${g.id}.title`)}</b>
            <span className="text-[13px] text-neutral-600">{t(`groups.${g.id}.sub`)}</span>
          </button>
        ))}
      </div>

      <div className="grid items-start gap-14 pt-[72px] pb-24 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label={t("categories")} className="sticky top-24 hidden gap-0.5 lg:grid">
          {GROUPS.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              onClick={() => {
                if (group && group !== g.id) setGroup(null);
              }}
              className={cn(
                "flex justify-between rounded-[10px] px-3.5 py-[9px] text-sm font-semibold text-slate-ink hover:bg-neutral-50 hover:no-underline",
                (group ?? active) === g.id && "bg-teal-50 text-teal-900",
              )}
            >
              {t(`groups.${g.id}.title`)}
              <span className="font-latin opacity-50">{(t.raw(`groups.${g.id}.items`) as QA[]).length}</span>
            </a>
          ))}
        </nav>
        <div>
          {total ? (
            groups.map((g) =>
              g.items.length ? (
                <div key={g.id} id={g.id} className="mb-12 scroll-mt-24">
                  <h2 className="mb-2 flex items-center gap-2.5 text-[22px] font-bold text-teal-900">
                    <g.icon className="size-5 text-amber-700" aria-hidden />
                    {t(`groups.${g.id}.title`)}
                  </h2>
                  <FaqAccordion
                    defaultOpen={Boolean(q)}
                    items={g.items.map((x, i) => ({ id: `${g.id}-${i}`, q: highlight(x.q, q), a: highlight(x.a, q) }))}
                  />
                </div>
              ) : null,
            )
          ) : (
            <div className="rounded-[20px] border border-dashed border-neutral-300 p-12 text-center text-slate-ink">
              <b className="mb-1 block text-lg text-teal-900">{t("noResults")}</b>
              {t("noResultsBody")}
            </div>
          )}
          {still}
        </div>
      </div>
    </>
  );
}
