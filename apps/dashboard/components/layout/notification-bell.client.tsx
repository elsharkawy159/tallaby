"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Bell, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import {
  notificationCount,
  notificationText,
  sellerNotificationHref,
  type NotificationFeed,
  type NotificationItem,
  type SellerNotificationType,
} from "@workspace/lib/notifications";
import { getSellerNotificationFeed, markSellerNotificationsReadAction } from "@/actions/notifications";
import { formatMoney, formatRelativeTime } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/supabase/client";

type Feed = NotificationFeed<SellerNotificationType>;

// Realtime nudges are the main signal; polling only runs while the channel is
// not subscribed (a dropped or refused socket, or no browser session). Each
// poll is a server action that also pays the proxy auth (docs/egress-audit.md §10).
const POLL_MS = 60_000;

/**
 * The seller's feed, kept fresh by the `seller_notification` broadcast on the
 * seller's own `user:<id>` topic (0098), a slow poll while the tab is visible,
 * and a refetch when the tab comes back.
 */
function useSellerNotificationFeed() {
  const [feed, setFeed] = useState<Feed | null>(null);

  const refresh = useCallback(async () => {
    try {
      setFeed(await getSellerNotificationFeed());
    } catch {
      // Signed out or offline: keep what is shown.
    }
  }, []);

  useEffect(() => {
    void refresh();

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    let live = false;
    const timer = window.setInterval(() => {
      if (!live) onVisible();
    }, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (cancelled || !data.user) return;
        await supabase.realtime.setAuth();
        if (cancelled) return;
        channel = supabase
          .channel(`user:${data.user.id}`, { config: { private: true } })
          .on("broadcast", { event: "seller_notification" }, () => void refresh())
          .subscribe((status) => {
            live = status === "SUBSCRIBED";
          });
      } catch {
        // Polling still keeps the bell current.
      }
    })();

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { feed, setFeed, refresh };
}

export function NotificationBell({ className }: { className?: string }) {
  const t = useTranslations("notifications");
  const { feed, setFeed, refresh } = useSellerNotificationFeed();
  const [open, setOpen] = useState(false);
  const unread = feed?.unreadCount ?? 0;

  const markRead = useCallback(
    async (ids?: string[]) => {
      // Optimistic: the list updates now, the refetch settles the count.
      setFeed((current) => {
        if (!current) return current;
        const now = new Date().toISOString();
        const hits = (item: NotificationItem) => !item.readAt && (!ids || ids.includes(item.id));
        const marked = current.items.filter(hits).length;
        return {
          items: current.items.map((item) => (hits(item) ? { ...item, readAt: now } : item)),
          unreadCount: Math.max(0, current.unreadCount - marked),
        };
      });
      try {
        await markSellerNotificationsReadAction(ids);
      } finally {
        void refresh();
      }
    },
    [refresh, setFeed],
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void refresh();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn("relative", className)}
          aria-label={unread > 0 ? t("openUnread", { count: unread }) : t("open")}
        >
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white tabular-nums">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <p className="text-sm font-semibold">{t("title")}</p>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => void markRead()}
              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <CheckCheck className="size-3.5" />
              {t("markAllRead")}
            </button>
          )}
        </div>
        <div className="max-h-[min(28rem,70vh)] overflow-y-auto overscroll-contain">
          {feed === null ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("loading")}</p>
          ) : feed.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="divide-y">
              {feed.items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onOpen={() => {
                    setOpen(false);
                    if (!item.readAt) void markRead([item.id]);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({
  item,
  onOpen,
}: {
  item: NotificationItem<SellerNotificationType>;
  onOpen: () => void;
}) {
  const t = useTranslations("notifications.types");
  const locale = useLocale();
  const amount = notificationText(item.data, "amount");
  const rating = typeof item.data.rating === "number" ? item.data.rating : 0;
  const values = {
    orderNumber: notificationText(item.data, "orderNumber"),
    amount: amount ? formatMoney(amount, locale) : "",
    rating,
    // Grouped rows (referral_commission_earned, one per day).
    count: notificationCount(item.data),
  };
  const href = sellerNotificationHref(item);
  const known = t.has(`${item.type}.title`);
  const content = (
    <>
      <span
        aria-hidden
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", item.readAt ? "bg-transparent" : "bg-primary")}
      />
      <span className="min-w-0 flex-1">
        <span className={cn("block text-sm", !item.readAt && "font-semibold")}>
          {known ? t(`${item.type}.title`) : item.type}
        </span>
        {known && (
          <span className="block text-xs text-muted-foreground">{t(`${item.type}.body`, values)}</span>
        )}
        <time dateTime={item.createdAt} className="mt-0.5 block text-[11px] text-muted-foreground">
          {formatRelativeTime(item.createdAt, locale)}
        </time>
      </span>
    </>
  );
  const className = "flex w-full gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/60";

  return (
    <li>
      {href ? (
        <Link href={href} onClick={onOpen} className={className}>
          {content}
        </Link>
      ) : (
        <button type="button" onClick={onOpen} className={className}>
          {content}
        </button>
      )}
    </li>
  );
}
