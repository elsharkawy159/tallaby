"use client";

import { createContext, useContext, useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@workspace/ui/lib/utils";
import { HOME_RANGES, type HomeRange } from "./home.shared";

type RangeContext = {
  range: HomeRange;
  pending: boolean;
  setRange: (range: HomeRange) => void;
};

const Ctx = createContext<RangeContext | null>(null);

/**
 * The period lives in the URL (`?range=30`) so the server renders the right
 * numbers and the view is shareable. Switching runs inside a transition: the
 * old figures stay on screen, dimmed, until the new ones stream in.
 */
export function HomeRangeProvider({
  range,
  children,
}: {
  range: HomeRange;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [optimisticRange, setOptimisticRange] = useOptimistic(range);

  const setRange = (next: HomeRange) => {
    if (next === optimisticRange) return;
    startTransition(() => {
      setOptimisticRange(next);
      const params = new URLSearchParams(searchParams);
      if (next === 7) params.delete("range");
      else params.set("range", String(next));
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return (
    <Ctx.Provider value={{ range: optimisticRange, pending, setRange }}>{children}</Ctx.Provider>
  );
}

function useRange() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRange must be used inside <HomeRangeProvider>");
  return ctx;
}

/** Segmented 7 / 30 / 90 day switch. */
export function RangeTabs() {
  const t = useTranslations("home.range");
  const { range, setRange } = useRange();

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className="inline-flex gap-0.5 rounded-[11px] border bg-card p-[3px]"
    >
      {HOME_RANGES.map((r) => {
        const on = r === range;
        return (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setRange(r)}
            className={cn(
              "h-[34px] whitespace-nowrap rounded-lg px-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
              on
                ? "bg-primary-soft font-semibold text-primary-ink"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("days", { count: r })}
          </button>
        );
      })}
    </div>
  );
}

/** Dims range-dependent content while a new period loads. */
export function RangePending({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useRange();
  return (
    <div
      aria-busy={pending}
      className={cn("transition-opacity duration-200", pending && "pointer-events-none opacity-60", className)}
    >
      {children}
    </div>
  );
}
