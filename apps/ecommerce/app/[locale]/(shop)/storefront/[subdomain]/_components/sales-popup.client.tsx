"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingBag, X } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  salesPopupAgo,
  salesPopupShowsOn,
  type SalesFeedItem,
  type SalesPopupPage,
} from "@workspace/lib/stores/sales-popup";
import { usePathname } from "@/i18n/navigation";

/** How long one toast stays on screen. */
const VISIBLE_MS = 6000;
/** Next toast to show this browsing session (moving between pages doesn't restart the list). */
const INDEX_KEY = "tallaby:sales-popup:next";
/** The visitor closed it: no more toasts this session. */
const CLOSED_KEY = "tallaby:sales-popup:closed";

function readSession(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Storage blocked: the toasts just start over on the next page.
  }
}

/**
 * Sales pop-up (ROADMAP.md F-22b): real recent orders of this store, one
 * small toast at a time, "Someone from Giza ordered <product> · 12 minutes
 * ago". Each order shows once per session; closing it stops the toasts for
 * the session. Never on cart, checkout or account pages, only on the pages
 * the seller picked. With reduced motion it appears without sliding.
 */
export function SalesPopup({
  items,
  delaySeconds,
  pages,
}: {
  items: SalesFeedItem[];
  delaySeconds: number;
  pages: SalesPopupPage[];
}) {
  const t = useTranslations("storeSalesPopup");
  const locale = useLocale();
  const pathname = usePathname();
  const allowed = salesPopupShowsOn({ enabled: true, pages }, pathname);
  const [current, setCurrent] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const mountedAt = useRef(0);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  useEffect(() => {
    setVisible(false);
    if (!allowed || !items.length || readSession(CLOSED_KEY)) return;
    const timers: number[] = [];
    const delayMs = delaySeconds * 1000;

    const showNext = () => {
      const index = Number(readSession(INDEX_KEY)) || 0;
      if (index >= items.length || readSession(CLOSED_KEY)) return;
      writeSession(INDEX_KEY, String(index + 1));
      setCurrent(index);
      setVisible(true);
      timers.push(
        window.setTimeout(() => {
          setVisible(false);
          timers.push(window.setTimeout(showNext, delayMs));
        }, VISIBLE_MS),
      );
    };

    timers.push(window.setTimeout(showNext, delayMs));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [allowed, items, delaySeconds]);

  const rtf = useMemo(() => {
    try {
      return new Intl.RelativeTimeFormat(`${locale}-u-nu-latn`, { numeric: "auto" });
    } catch {
      return new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    }
  }, [locale]);

  if (!allowed || current == null) return null;
  const item = items[current];
  if (!item) return null;

  // The feed's age was worked out at render; add the time this page has been open.
  const elapsed = mountedAt.current ? Math.floor((Date.now() - mountedAt.current) / 60_000) : 0;
  const ago = salesPopupAgo(item.minutesAgo + elapsed);
  const when = ago.unit === "minute" && ago.value < 1 ? t("justNow") : rtf.format(-ago.value, ago.unit);

  const close = () => {
    writeSession(CLOSED_KEY, "1");
    setVisible(false);
  };

  return (
    <div
      data-sf-motion="off"
      role="status"
      aria-live="polite"
      aria-hidden={!visible}
      className={cn(
        // Above the phone bottom navigation / cart bar.
        "pointer-events-none fixed inset-x-4 bottom-24 z-40 flex justify-start sm:inset-x-auto sm:start-4 sm:bottom-4",
        "transition-opacity duration-300 motion-safe:transition-[opacity,transform]",
        visible ? "opacity-100 motion-safe:translate-y-0" : "opacity-0 motion-safe:translate-y-3",
      )}
    >
      <div
        className={cn(
          "flex w-full max-w-sm items-start gap-3 rounded-2xl border border-(--sf-line) bg-(--sf-paper) p-3 pe-2 text-(--sf-ink) shadow-lg",
          visible && "pointer-events-auto",
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--sf-brand)/10 text-(--sf-brand)">
          <ShoppingBag className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-sm leading-snug">
          <p className="text-(--sf-muted)">
            {item.governorate ? t("someoneFrom", { governorate: item.governorate }) : t("someone")}
          </p>
          <p className="truncate font-semibold">{item.product}</p>
          <p className="text-xs text-(--sf-muted)">{when}</p>
        </div>
        <button
          type="button"
          onClick={close}
          tabIndex={visible ? 0 : -1}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-(--sf-muted) transition-colors hover:bg-(--sf-shelf) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--sf-brand)"
          aria-label={t("close")}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
