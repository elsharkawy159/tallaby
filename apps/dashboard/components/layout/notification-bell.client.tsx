"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Bell, BellOff, BellRing, Check, CheckCheck, Settings2, X } from "lucide-react";
import { AnchoredSheet, IconButton, IconTile } from "@/components/seller-ui";
import {
  notificationText,
  sellerNotificationHref,
  sellerNotificationValues,
  type NotificationFeed,
  type NotificationItem,
  type SellerNotificationType,
} from "@workspace/lib/notifications";
import { getSellerNotificationFeed, markSellerNotificationsReadAction } from "@/actions/notifications";
import { formatRelativeTime, formatWalletMoney } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { createClient } from "@/supabase/client";
import { NOTIFICATION_LOOK, notificationDay } from "./notification-look.lib";

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

/** The bell and its panel (`.ntf`): anchored on desktop, a bottom sheet on phones. */
export function NotificationBell() {
  const t = useTranslations("notifications");
  const { feed, setFeed, refresh } = useSellerNotificationFeed();
  const tPush = useTranslations("pushAlerts");
  const [open, setOpen] = useState(false);
  const unread = feed?.unreadCount ?? 0;
  // Phone alerts prompt (F-06): only while this browser can push and was never asked.
  const [canAskPush, setCanAskPush] = useState(false);
  useEffect(() => {
    if (!open) return;
    setCanAskPush(
      "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window &&
        Notification.permission === "default",
    );
  }, [open]);

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

  const groups = (["today", "yesterday", "older"] as const)
    .map((day) => ({ day, items: (feed?.items ?? []).filter((item) => notificationDay(item.createdAt) === day) }))
    .filter((group) => group.items.length > 0);

  return (
    <AnchoredSheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void refresh();
      }}
      label={t("title")}
      className="max-h-[min(620px,calc(100dvh-90px))] w-[400px]"
      trigger={
        <IconButton aria-label={unread > 0 ? t("openUnread", { count: unread }) : t("open")}>
          <Bell />
          {unread > 0 && (
            <b className="absolute -end-0.5 top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-[5px] font-montserrat text-[10.5px] font-extrabold text-(--tallaby-teal-900) shadow-[0_0_0_2px_var(--background)] tabular-nums">
              {unread > 9 ? "9+" : unread}
            </b>
          )}
        </IconButton>
      }
    >
      <div className="flex shrink-0 items-center gap-1 pb-2 pe-2.5 ps-[18px] pt-3.5">
        <b className="min-w-0 flex-1 text-base font-bold text-(--s-ink)">{t("title")}</b>
        <button
          type="button"
          disabled={unread === 0}
          onClick={() => void markRead()}
          className="inline-flex h-8 cursor-pointer items-center gap-[5px] whitespace-nowrap rounded-[10px] px-2.5 text-xs font-bold text-(--s-link) transition-colors duration-150 hover:bg-(--s-hover) disabled:pointer-events-none disabled:opacity-40"
        >
          <CheckCheck aria-hidden className="size-[15px]" />
          {t("markAllRead")}
        </button>
        <IconButton asChild aria-label={t("settings")}>
          <Link href="/settings#push-alerts" onClick={() => setOpen(false)}>
            <Settings2 />
          </Link>
        </IconButton>
        <IconButton aria-label={t("close")} onClick={() => setOpen(false)} className="min-[601px]:hidden">
          <X />
        </IconButton>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-[3px] overflow-y-auto overscroll-contain px-2 pb-2 pt-1 [scrollbar-width:thin]">
        {feed === null ? (
          <p className="px-4 py-10 text-center text-[13px] text-(--s-subtle)">{t("loading")}</p>
        ) : feed.items.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-5 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-(--s-fill) text-(--s-faint)">
              <BellOff aria-hidden className="size-5" />
            </span>
            <b className="mt-1 text-sm font-bold text-(--s-ink)">{t("emptyTitle")}</b>
            <p className="text-[12.5px] text-(--s-subtle)">{t("empty")}</p>
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.day} className="flex flex-col gap-[3px]">
              <p className="px-2.5 pb-1 pt-2.5 text-[11.5px] font-bold text-(--s-faint)">{t(group.day)}</p>
              <ul className="flex flex-col gap-[3px]">
                {group.items.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    onOpen={() => {
                      setOpen(false);
                      if (!item.readAt) void markRead([item.id]);
                    }}
                    onMarkRead={() => void markRead([item.id])}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
      {canAskPush && (
        <Link
          href="/settings#push-alerts"
          onClick={() => setOpen(false)}
          className="flex shrink-0 items-center gap-2 border-t border-(--s-line-soft) bg-(--s-surface-2) px-[18px] py-2.5 text-xs font-bold text-(--s-link) no-underline transition-colors duration-150 hover:bg-(--s-hover)"
        >
          <BellRing aria-hidden className="size-3.5" />
          {tPush("bellPrompt")}
        </Link>
      )}
    </AnchoredSheet>
  );
}

function NotificationRow({
  item,
  onOpen,
  onMarkRead,
}: {
  item: NotificationItem<SellerNotificationType>;
  onOpen: () => void;
  onMarkRead: () => void;
}) {
  const t = useTranslations("notifications.types");
  const tBell = useTranslations("notifications");
  const locale = useLocale();
  const values = sellerNotificationValues(item.data, (amount, currency) => formatWalletMoney(amount, currency, locale));
  const href = sellerNotificationHref(item);
  // A message from the Tallaby team (0131) carries the admin's own title and text.
  const isMessage = item.type === "admin_message";
  const known = !isMessage && t.has(`${item.type}.title`);
  const title = isMessage
    ? notificationText(item.data, "title") || t("admin_message.fallbackTitle")
    : known
      ? t(`${item.type}.title`)
      : item.type;
  const body = isMessage ? notificationText(item.data, "body") : known ? t(`${item.type}.body`, values) : "";
  const unread = !item.readAt;
  const look = NOTIFICATION_LOOK[item.type] ?? { icon: Bell, tone: "primary" as const };
  // The whole row opens it; the link stretches over the row, under the mark-read button.
  const stretch = "text-start after:absolute after:inset-0 after:rounded-2xl";

  return (
    <li
      className={cn(
        "group/row relative flex gap-3 rounded-2xl p-2.5 transition-colors duration-150 max-[600px]:px-2.5 max-[600px]:py-3",
        unread
          ? "bg-accent-soft/60 hover:bg-accent-soft before:absolute before:start-0.5 before:top-[18px] before:size-1.5 before:rounded-full before:bg-accent"
          : "hover:bg-(--s-tint)",
      )}
    >
      <IconTile icon={look.icon} tone={look.tone} className="size-10 rounded-[13px] [&_svg]:size-[18px]" />
      <div className="min-w-0 flex-1">
        {isMessage && <span className="block text-[11px] font-bold text-(--s-link)">{t("admin_message.from")}</span>}
        {href ? (
          <Link
            href={href}
            onClick={onOpen}
            className={cn("block text-[13.5px] leading-normal text-(--s-text) no-underline hover:text-(--s-ink)", unread ? "font-bold" : "font-semibold", stretch)}
          >
            {title}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onOpen}
            className={cn("block w-full cursor-pointer text-[13.5px] leading-normal text-(--s-text)", unread ? "font-bold" : "font-semibold", stretch)}
          >
            {title}
          </button>
        )}
        {body && (
          <p className={cn("mt-px text-pretty text-[12.5px] leading-[1.6] text-(--s-muted)", isMessage && "whitespace-pre-line break-words")}>
            {body}
          </p>
        )}
        <time dateTime={item.createdAt} className="mt-1.5 block text-[11.5px] text-(--s-faint)">
          {formatRelativeTime(item.createdAt, locale)}
        </time>
      </div>
      {unread && (
        <IconButton
          aria-label={tBell("markRead")}
          onClick={onMarkRead}
          className="z-[1] size-[30px] rounded-[9px] text-(--s-faint) opacity-0 focus-visible:opacity-100 group-hover/row:opacity-100 pointer-coarse:opacity-100 max-[600px]:size-10 [&_svg]:size-[15px]"
        >
          <Check />
        </IconButton>
      )}
    </li>
  );
}
