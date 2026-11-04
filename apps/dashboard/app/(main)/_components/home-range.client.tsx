"use client";

import { createContext, useContext, useOptimistic, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Store } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { HOME_RANGES, type HomeChannel, type HomeRange } from "./home.shared";

type RangeContext = {
  range: HomeRange;
  channel: HomeChannel;
  pending: boolean;
  setRange: (range: HomeRange) => void;
  setChannel: (channel: HomeChannel) => void;
};

/** The design's `.sel` pill. It shares the row with its neighbours up to 720px. */
const CONTROL_TRIGGER =
  "w-auto min-w-0 gap-2 rounded-full border border-(--s-field) bg-(--s-surface) px-3.5 text-[13px] font-semibold text-(--s-body) shadow-none transition-colors duration-150 hover:border-(--s-outline) !h-[42px] data-[state=open]:border-(--s-primary) max-[720px]:flex-[1_1_auto] [&>svg:last-child]:ms-auto";

const Ctx = createContext<RangeContext | null>(null);

/**
 * The period lives in the URL (`?range=30`) so the server renders the right
 * numbers and the view is shareable. Switching runs inside a transition: the
 * old figures stay on screen, dimmed, until the new ones stream in.
 */
export function HomeRangeProvider({
  range,
  channel = "all",
  children,
}: {
  range: HomeRange;
  channel?: HomeChannel;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [optimisticRange, setOptimisticRange] = useOptimistic(range);
  const [optimisticChannel, setOptimisticChannel] = useOptimistic(channel);

  const replaceParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value === null) params.delete(key);
    else params.set(key, value);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const setRange = (next: HomeRange) => {
    if (next === optimisticRange) return;
    startTransition(() => {
      setOptimisticRange(next);
      replaceParam("range", next === 7 ? null : String(next));
    });
  };

  const setChannel = (next: HomeChannel) => {
    if (next === optimisticChannel) return;
    startTransition(() => {
      setOptimisticChannel(next);
      replaceParam("channel", next === "all" ? null : next);
    });
  };

  return (
    <Ctx.Provider
      value={{ range: optimisticRange, channel: optimisticChannel, pending, setRange, setChannel }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useRange() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRange must be used inside <HomeRangeProvider>");
  return ctx;
}

/** 7 / 30 / 90 day period picker. */
export function RangeSelect() {
  const t = useTranslations("home.range");
  const { range, setRange } = useRange();

  return (
    <Select value={String(range)} onValueChange={(value) => setRange(Number(value) as HomeRange)}>
      <SelectTrigger className={CONTROL_TRIGGER} aria-label={t("label")}>
        <Calendar aria-hidden className="size-[15px] text-(--s-subtle)" />
        <SelectValue>{t("days", { count: range })}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {HOME_RANGES.map((r) => (
          <SelectItem key={r} value={String(r)}>
            {t("days", { count: r })}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
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

/** All sales / orders outside a store (tallaby.com) / one store. Options come from the server (the seller's own stores). */
export function ChannelSelect({ stores }: { stores: { id: string; name: string }[] }) {
  const t = useTranslations("home.channel");
  const { channel, setChannel } = useRange();

  return (
    <Select value={channel} onValueChange={(value) => setChannel(value as HomeChannel)}>
      <SelectTrigger className={CONTROL_TRIGGER} aria-label={t("label")}>
        <Store aria-hidden className="size-[15px] text-(--s-subtle)" />
        <SelectValue>
          {channel === "all" || channel === "marketplace"
            ? t(channel)
            : (stores.find((store) => store.id === channel)?.name ?? t("all"))}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("all")}</SelectItem>
        <SelectItem value="marketplace">{t("marketplace")}</SelectItem>
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
