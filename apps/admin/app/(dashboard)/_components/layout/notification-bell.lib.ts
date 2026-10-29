import { notificationCount, notificationText, type NotificationItem } from '@workspace/lib/notifications'

const TOP_UP_METHODS: Record<string, string> = {
  vodafone_cash: 'Vodafone Cash',
  instapay: 'InstaPay',
}

const INTEGRATION_PROVIDERS: Record<string, string> = {
  meta_pixel: 'Meta Pixel',
  meta_capi: 'Meta Conversions API',
  google_analytics: 'Google Analytics',
  google_tag_manager: 'Google Tag Manager',
  tiktok_pixel: 'TikTok Pixel',
  snapchat_pixel: 'Snapchat Pixel',
  google_sheets: 'Google Sheets',
  shopify_import: 'Shopify import',
  bosta: 'Bosta',
}

/** "Seller · Store", leaving out what is missing or repeated. */
function who(seller: string, store: string): string {
  return [seller, store !== seller && store].filter(Boolean).join(' · ')
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
    case 'feature_request_created': {
      const title = notificationText(n.data, 'title')
      return {
        title: 'New roadmap idea',
        body: [store, title && `“${title}”`].filter(Boolean).join(' · ') || 'A seller suggested a feature.',
      }
    }
    case 'product_created': {
      const count = notificationCount(n.data)
      const title = notificationText(n.data, 'title')
      const what = count > 1 ? `${count} products` : title && `“${title}”`
      return {
        title: count > 1 ? 'Products added' : 'New product added',
        body: [who(seller, store), what].filter(Boolean).join(' · ') || 'A seller added a product.',
      }
    }
    case 'first_order_received': {
      const orderNumber = notificationText(n.data, 'orderNumber')
      return {
        title: 'First order for a seller',
        body: [who(seller, store), orderNumber && `#${orderNumber}`].filter(Boolean).join(' · ') ||
          'A seller received their first order.',
      }
    }
    case 'integration_connected': {
      const provider = notificationText(n.data, 'provider')
      const name = INTEGRATION_PROVIDERS[provider] ?? provider
      return {
        title: name ? `${name} connected` : 'Integration connected',
        body: who(seller, store) || 'A store connected an integration.',
      }
    }
    case 'store_unpublished':
      return {
        title: 'Store website taken offline',
        body: [who(seller, store), subdomain && `(${subdomain})`].filter(Boolean).join(' ') ||
          'A seller turned their website off.',
      }
    case 'referral_payout_requested': {
      const amount = notificationText(n.data, 'amount')
      return {
        title: 'Affiliate withdrawal requested',
        body: [store, amount && `EGP ${amount}`].filter(Boolean).join(' · ') || 'A referrer asked to withdraw their commission.',
      }
    }
    case 'store_deleted':
      return {
        title: 'Store deleted',
        body: [who(seller, store), subdomain && `(${subdomain})`].filter(Boolean).join(' ') ||
          'A seller deleted a store.',
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
