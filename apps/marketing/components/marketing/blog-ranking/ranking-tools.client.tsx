"use client";

import * as React from "react";
import { Link2 } from "lucide-react";
import { useScrollSpy } from "@/components/marketing/site/use-scroll-spy.client";
import { cn } from "@workspace/ui/lib/utils";

/** The reading bar under the header. Updates on scroll only, so nothing moves on its own. */
export function ReadingProgress({ articleId }: { articleId: string }) {
  const bar = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    const onScroll = () => {
      const article = document.getElementById(articleId);
      if (!article || !bar.current) return;
      const progress = (window.scrollY - article.offsetTop + window.innerHeight * 0.4) / article.offsetHeight;
      bar.current.style.width = `${Math.min(1, Math.max(0, progress)) * 100}%`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [articleId]);
  return (
    <div aria-hidden className="fixed inset-x-0 top-[68px] z-[49] h-[3px]">
      <i ref={bar} className="block h-full w-0 bg-amber-600" />
    </div>
  );
}

export type TocEntry = { id: string; title: string; rank?: number };

const pad = (rank: number) => String(rank).padStart(2, "0");

/** The sticky contents list; the phone version is rendered with `RankingMobileToc`. */
export function RankingToc({ entries, title }: { entries: TocEntry[]; title: string }) {
  const active = useScrollSpy(entries.map((entry) => entry.id));
  return (
    <nav aria-label={title} className="sticky top-[110px] hidden max-h-[calc(100vh-130px)] content-start gap-0.5 self-start overflow-auto text-sm min-[821px]:grid">
      <b className="mb-1.5 text-xs text-neutral-500">{title}</b>
      {entries.map((entry) => (
        <a
          key={entry.id}
          href={`#${entry.id}`}
          className={cn(
            "border-s-2 border-neutral-200 px-3 py-1.5 leading-[1.45] text-[#4d5f64] hover:text-teal-900 hover:no-underline",
            entry.rank && "ps-6 py-1 text-[13px]",
            active === entry.id && "border-amber-600 font-semibold text-teal-900",
          )}
        >
          {entry.rank ? <span className="me-1.5 font-latin text-[#a3b1b4]">{pad(entry.rank)}</span> : null}
          {entry.title}
        </a>
      ))}
    </nav>
  );
}

export function CopyLinkButton({ url, label, doneLabel }: { url: string; label: string; doneLabel: string }) {
  const [done, setDone] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard?.writeText(url);
        setDone(true);
      }}
      className="flex h-10 items-center gap-1.5 rounded-full border border-[#dfe8ea] bg-white px-3.5 text-[13px] font-semibold text-teal-700 hover:bg-teal-50"
    >
      <Link2 className="size-[15px]" aria-hidden />
      <span aria-live="polite">{done ? doneLabel : label}</span>
    </button>
  );
}

/** A summary row that jumps to its platform when pressed anywhere, not only on the name. */
export function SummaryRow({ target, highlighted, children }: { target: string; highlighted?: boolean; children: React.ReactNode }) {
  return (
    <tr
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) return;
        window.location.hash = target;
      }}
      className={cn("cursor-pointer transition-colors duration-150 hover:bg-[#f8fbfb]", highlighted && "bg-amber-600/[0.07] hover:bg-amber-600/[0.12]")}
    >
      {children}
    </tr>
  );
}
