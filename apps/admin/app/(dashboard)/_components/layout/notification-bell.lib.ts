import { notificationText, type NotificationItem } from '@workspace/lib/notifications'

const TOP_UP_METHODS: Record<string, string> = {
  vodafone_cash: 'Vodafone Cash',
  instapay: 'InstaPay',
}

/** The bell's English copy for one admin notification. */
export function describeAdminNotification(n: Pick<NotificationItem, 'type' | 'data'>): {
  title: string
  body: string
} {
  const seller = notificationText(n.data, 'sellerName')
  const store = notificationText(n.data, 'storeName')
  const subdomain = notificationText(n.data, 'subdomain')

  switch (n.type) {
    case 'seller_created':
      return { title: 'New seller signed up', body: seller || 'A new seller account was created.' }
    case 'store_created':
      return {
        title: 'New store opened',
        body: [store, subdomain && `(${subdomain})`].filter(Boolean).join(' ') || 'A seller opened another store.',
      }
    case 'store_published':
      return {
        title: 'Store website published',
        body: store ? `${store} is now live.` : 'A store website went live for the first time.',
      }
    case 'top_up_requested': {
      const amount = notificationText(n.data, 'amount')
      const method = TOP_UP_METHODS[notificationText(n.data, 'method')] ?? ''
      const detail = [amount && `EGP ${amount}`, method && `via ${method}`].filter(Boolean).join(' ')
      return {
        title: 'Top-up awaiting review',
        body: [seller, detail].filter(Boolean).join(' · ') || 'A manual top-up needs review.',
      }
    }
    default:
      return { title: 'Notification', body: '' }
  }
}

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
]

/** "5 minutes ago"-style time for a notification. */
export function relativeTime(iso: string, now = Date.now()): string {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000)
  if (!Number.isFinite(seconds)) return ''
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.trunc(seconds / size), unit)
  }
  return 'just now'
}
