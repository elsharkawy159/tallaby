'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@workspace/ui/components/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/popover'
import { cn } from '@workspace/ui/lib/utils'
import {
  adminNotificationHref,
  type AdminNotificationType,
  type NotificationFeed,
  type NotificationItem,
} from '@workspace/lib/notifications'
import {
  getAdminNotificationFeed,
  markAdminNotificationsReadAction,
} from '@/actions/notifications'
import { createClient } from '@/supabase/client'
import { describeAdminNotification, relativeTime } from './notification-bell.lib'

type Feed = NotificationFeed<AdminNotificationType>

// Realtime nudges are the main signal; polling only runs while the channel is
// not subscribed (a dropped or refused socket). Each poll is a server action that
// also pays the proxy's auth lookups (docs/egress-audit.md §10).
const POLL_MS = 60_000

/**
 * The feed, kept fresh by the `admin:notifications` broadcast (0098), a slow
 * poll while the tab is visible, and a refetch when the tab comes back.
 */
function useAdminNotificationFeed() {
  const [feed, setFeed] = useState<Feed | null>(null)

  const refresh = useCallback(async () => {
    try {
      setFeed(await getAdminNotificationFeed())
    } catch {
      // Signed out or offline: keep what is shown.
    }
  }, [])

  useEffect(() => {
    void refresh()

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    let live = false
    const timer = window.setInterval(() => {
      if (!live) onVisible()
    }, POLL_MS)
    document.addEventListener('visibilitychange', onVisible)

    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false
    void (async () => {
      try {
        await supabase.realtime.setAuth()
        if (cancelled) return
        channel = supabase
          .channel('admin:notifications', { config: { private: true } })
          .on('broadcast', { event: 'admin_notification' }, () => void refresh())
          .subscribe((status) => {
            live = status === 'SUBSCRIBED'
          })
      } catch {
        // Polling still keeps the bell current.
      }
    })()

    return () => {
      cancelled = true
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
      if (channel) void supabase.removeChannel(channel)
    }
  }, [refresh])

  return { feed, setFeed, refresh }
}

export function NotificationBell() {
  const { feed, setFeed, refresh } = useAdminNotificationFeed()
  const [open, setOpen] = useState(false)
  const unread = feed?.unreadCount ?? 0

  const markRead = useCallback(
    async (ids?: string[]) => {
      // Optimistic: the list updates now, the refetch settles the count.
      setFeed((current) => {
        if (!current) return current
        const now = new Date().toISOString()
        const items = current.items.map((item) =>
          !item.readAt && (!ids || ids.includes(item.id)) ? { ...item, readAt: now } : item,
        )
        const marked = current.items.filter((item) => !item.readAt && (!ids || ids.includes(item.id))).length
        return { items, unreadCount: Math.max(0, current.unreadCount - marked) }
      })
      try {
        await markAdminNotificationsReadAction(ids)
      } finally {
        void refresh()
      }
    },
    [refresh, setFeed],
  )

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) void refresh()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative size-9"
          aria-label={unread > 0 ? `Notifications (${unread} unread)` : 'Notifications'}
        >
          <Bell className="text-muted-foreground" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white tabular-nums">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={() => void markRead()}>
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[min(28rem,70vh)] overflow-y-auto overscroll-contain">
          {feed === null ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : feed.items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            <ul className="divide-y">
              {feed.items.map((item) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  onOpen={() => {
                    setOpen(false)
                    if (!item.readAt) void markRead([item.id])
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NotificationRow({
  item,
  onOpen,
}: {
  item: NotificationItem<AdminNotificationType>
  onOpen: () => void
}) {
  const { title, body } = describeAdminNotification(item)
  const href = adminNotificationHref(item)
  const content = (
    <>
      <span
        aria-hidden
        className={cn('mt-1.5 size-2 shrink-0 rounded-full', item.readAt ? 'bg-transparent' : 'bg-primary')}
      />
      <span className="min-w-0 flex-1">
        <span className={cn('block text-sm', !item.readAt && 'font-semibold')}>{title}</span>
        {body && <span className="block truncate text-xs text-muted-foreground">{body}</span>}
        <time dateTime={item.createdAt} className="mt-0.5 block text-[11px] text-muted-foreground">
          {relativeTime(item.createdAt)}
        </time>
      </span>
    </>
  )
  const className = 'flex w-full gap-3 px-4 py-3 text-start transition-colors hover:bg-muted/60'

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
  )
}
