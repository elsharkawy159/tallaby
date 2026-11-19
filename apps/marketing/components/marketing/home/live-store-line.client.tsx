"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Num } from "@/components/marketing/site/layout-primitives";
import { selectStoreLine, storeAge, type DatedStore, type RecentStore } from "@/lib/marketing/recent-stores.lib";
import { useInView, useReducedMotion } from "./use-demo.client";

const TICK_MS = 30_000;
const ROTATE_MS = 6000;
const FADE_MS = 350;
// Smaller on phones (owner, 2026-11-09); the placeholder uses the same height.
const LINE_CLASS = "h-8 min-[641px]:h-[38px] max-w-full";

function subscribeClock(onChange: () => void) {
  const id = window.setInterval(onChange, TICK_MS);
  return () => window.clearInterval(id);
}

/**
 * "A new fashion store opened 4 minutes ago" (owner, F-73: the industry, never a
 * store or seller name; a store whose category isn't one of the listed
 * industries gets the generic line). The page may be a cached copy, so the
 * age comes from the store's real time and the visitor's clock. The first render
 * uses `readAt`, the same time the server used, so hydration always matches. If
 * the store ages out on an old copy of the page, the line keeps its space for that
 * visit instead of moving the page.
 */
export function LiveStoreLine({ stores, readAt }: { stores: RecentStore[]; readAt: number }) {
  const t = useTranslations("home.hero.live");
  const now = React.useSyncExternalStore(
    subscribeClock,
    // A clock behind the server's would read a real store as future-dated.
    () => Math.max(Math.floor(Date.now() / TICK_MS) * TICK_MS, readAt),
    () => readAt,
  );
  const line = selectStoreLine(stores, now);
  const count = line.kind === "recent" ? line.stores.length : 0;

  const reduced = useReducedMotion();
  const [ref, inView] = useInView<HTMLParagraphElement>();
  const [hovered, setHovered] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const [leaving, setLeaving] = React.useState(false);
  const rotating = count > 1 && !reduced && inView && !hovered;

  React.useEffect(() => {
    if (!rotating) return;
    let fade: number | undefined;
    const id = window.setInterval(() => {
      setLeaving(true);
      fade = window.setTimeout(() => {
        setIndex((i) => i + 1);
        setLeaving(false);
      }, FADE_MS);
    }, ROTATE_MS);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(fade);
      setLeaving(false);
    };
  }, [rotating]);

  if (line.kind === "none") {
    return selectStoreLine(stores, readAt).kind === "none" ? null : <p aria-hidden className={`invisible ${LINE_CLASS}`} />;
  }

  const store: DatedStore = line.kind === "latest" ? line.store : (line.stores[reduced ? 0 : index % count] as DatedStore);
  const age = storeAge(store.publishedAtMs, now);
  const tags = {
    industry: store.industry ? t(`industries.${store.industry}`) : "",
    kind: (chunks: React.ReactNode) => <b className="min-w-0 truncate font-bold text-teal-900">{chunks}</b>,
    age: () =>
      age.unit === "now"
        ? t("now")
        : t.rich(age.unit, {
            count: age.count,
            num: (chunks) => <Num className="font-bold text-teal-900">{chunks}</Num>,
          }),
  };

  return (
    <p
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${LINE_CLASS} inline-flex items-center gap-2 rounded-full border border-[#e3ebed]/80 bg-white/80 backdrop-blur-sm ps-3 pe-3.5 text-[12.5px] whitespace-nowrap min-[641px]:gap-2.5 min-[641px]:ps-3.5 min-[641px]:pe-4 min-[641px]:text-sm text-ink-600 shadow-[0_2px_10px_rgba(20,81,99,0.06)]`}
    >
      <i aria-hidden className={`size-[9px] flex-none rounded-full bg-[#16a34a] ${line.kind === "recent" ? "animate-pulse-ring" : ""}`} />
      {/* Only the industry shrinks on a narrow phone: every other run keeps its width (whitespace-pre). */}
      <span className={`flex min-w-0 items-baseline whitespace-pre transition-[opacity,transform] duration-[350ms] ${leaving && rotating ? "-translate-y-1.5 opacity-0" : ""}`}>
        {t.rich(store.industry ? "industry" : "generic", tags)}
      </span>
    </p>
  );
}
