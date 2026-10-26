import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  Landmark,
  Megaphone,
  Package,
  PlugZap,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Store,
  UserCheck,
  Wallet,
  type LucideIcon
} from 'lucide-react'
import { formatCurrency } from '@workspace/lib'
import { storeHostname } from '@workspace/lib/storefront'
import { cn } from '@workspace/ui/lib/utils'
import { RemoteImage } from '@/components/media/remote-image'
import {
  getOverviewMix,
  getOverviewStores,
  getOverviewTrend
} from '@/lib/analytics/overview.server'
import {
  biggestFunnelDrop,
  initials,
  sharePercent
} from '@/lib/analytics/overview.lib'
import type { OverviewDay, OverviewKpi, OverviewRange } from '@/lib/analytics/overview.types'
import { getSidebarCounts } from './_components/layout/sidebar.server'
import { relativeTime } from './_components/layout/notification-bell.lib'
import { GmvFeesChart } from './dashboard-chart.client'

/**
 * The admin home ("Platform overview", Claude Design "Admin Dashboard").
 * Each export is an async Server Component owning one query; page.tsx wraps
 * each in its own Suspense boundary so a slow aggregate delays only its cards.
 */

const num = (value: number) => Math.round(value).toLocaleString('en-US')
const money = (value: number) => formatCurrency(value, 'en-EG', { maximumFractionDigits: 0 })

export function Panel ({ className, children }: { className?: string, children: ReactNode }) {
  return (
    <div className={cn('flex min-w-0 flex-col rounded-[14px] border bg-card shadow-xs', className)}>
      {children}
    </div>
  )
}

export function PanelHeader ({ title, description, action }: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-5 pt-[18px]">
      <div>
        <h3 className="text-[15px] font-bold">{title}</h3>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}

function PanelBody ({ className, children }: { className?: string, children: ReactNode }) {
  return <div className={cn('flex flex-1 flex-col px-5 pt-4 pb-5', className)}>{children}</div>
}

function Note ({ children, className }: { children: ReactNode, className?: string }) {
  return (
    <div className={cn('mt-auto border-t pt-3.5 text-xs text-muted-foreground [&_b]:text-foreground', className)}>
      {children}
    </div>
  )
}

function Pill ({ tone = 'neutral', children }: {
  tone?: 'neutral' | 'primary' | 'accent' | 'success' | 'danger'
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap capitalize',
        tone === 'neutral' && 'bg-muted text-muted-foreground',
        tone === 'primary' && 'border-transparent bg-primary-soft text-primary-ink',
        tone === 'accent' && 'border-transparent bg-accent-soft text-accent-ink',
        tone === 'success' && 'border-transparent bg-success-soft text-success',
        tone === 'danger' && 'border-transparent bg-destructive-soft text-destructive'
      )}
    >
      {children}
    </span>
  )
}

const SITE_TONE: Record<string, 'success' | 'neutral' | 'accent'> = {
  published: 'success',
  draft: 'neutral',
  unpublished: 'accent'
}

function Delta ({ value }: { value: number }) {
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-semibold', up ? 'text-success' : 'text-destructive')}>
      <Icon className="size-[13px]" strokeWidth={2.25} />
      {Math.abs(value)}%
    </span>
  )
}

function Sparkline ({ values, up }: { values: number[], up: boolean }) {
  if (values.length < 2) return null
  const w = 84
  const h = 28
  const max = Math.max(...values)
  const min = Math.min(...values)
  const points = values
    .map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - ((v - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`)
    .join(' ')
  return (
    <svg className="h-7 w-[84px] shrink-0" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke={up ? 'var(--success)' : 'var(--destructive)'}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Sums days into at most 14 buckets so a 90-day sparkline stays readable. */
function bucket (days: OverviewDay[], key: keyof Omit<OverviewDay, 'date'>): number[] {
  const size = Math.max(1, Math.ceil(days.length / 14))
  const out: number[] = []
  for (let i = 0; i < days.length; i += size) {
    out.push(days.slice(i, i + size).reduce((total, day) => total + day[key], 0))
  }
  return out
}

function KpiTile ({ title, icon: Icon, value, unit, metric, hint, spark, href }: {
  title: string
  icon: LucideIcon
  value: string
  unit?: string
  metric: OverviewKpi
  hint: string
  spark?: number[]
  href: string
}) {
  return (
    <Link href={href} className="group">
      <Panel className="h-full gap-1.5 px-[18px] py-4 transition-colors group-hover:border-primary/40">
        <div className="flex items-center justify-between text-[12.5px] font-medium text-muted-foreground">
          {title}
          <Icon className="size-4 text-faint" strokeWidth={1.75} />
        </div>
        <div className="text-2xl font-bold tracking-tight tabular-nums">
          {value}
          {unit && <small className="ml-1 text-[13px] font-semibold text-muted-foreground">{unit}</small>}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="whitespace-nowrap">
            <Delta value={metric.changePercent} /> {hint}
          </span>
          {spark && <Sparkline values={spark} up={metric.changePercent >= 0} />}
        </div>
      </Panel>
    </Link>
  )
}

export async function KpiSection ({ range }: { range: OverviewRange }) {
  const trend = await getOverviewTrend(range)
  return (
    <section className="grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-5">
      <KpiTile
        title="GMV"
        icon={Banknote}
        value={num(trend.gmv.current)}
        unit="EGP"
        metric={trend.gmv}
        hint="vs previous"
        spark={bucket(trend.days, 'gmv')}
        href="/orders"
      />
      <KpiTile
        title="Platform fees"
        icon={Landmark}
        value={num(trend.fees.current)}
        unit="EGP"
        metric={trend.fees}
        hint="EGP 5 per delivered order"
        spark={bucket(trend.days, 'fees')}
        href="/wallets?tab=ledger"
      />
      <KpiTile
        title="Active stores"
        icon={Store}
        value={num(trend.activeStores.current)}
        metric={trend.activeStores}
        hint="≥1 storefront order"
        href="/stores"
      />
      <KpiTile
        title="Orders"
        icon={ShoppingCart}
        value={num(trend.orders.current)}
        metric={trend.orders}
        hint="vs previous"
        spark={bucket(trend.days, 'orders')}
        href="/orders"
      />
      <KpiTile
        title="New stores"
        icon={Sparkles}
        value={num(trend.newStores.current)}
        metric={trend.newStores}
        hint="vs previous"
        spark={bucket(trend.days, 'newStores')}
        href="/stores"
      />
    </section>
  )
}

export async function TrendSection ({ range }: { range: OverviewRange }) {
  const trend = await getOverviewTrend(range)
  const summary: Array<[string, string]> = [
    ['Platform fees', money(trend.fees.current)],
    ['Delivered orders', num(trend.deliveredOrders)],
    ['Average order', money(trend.orders.current > 0 ? trend.gmv.current / trend.orders.current : 0)],
    ['Wallet top-ups', money(trend.topUps)]
  ]
  return (
    <Panel>
      <PanelHeader
        title="GMV and platform fees"
        description="Merchant sales processed vs. what Tallaby earned"
        action={
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span><i className="mr-1.5 inline-block size-2.5 rounded-[3px] bg-primary align-[-1px]" />GMV</span>
            <span><i className="mr-1.5 inline-block size-2.5 rounded-[3px] bg-accent align-[-1px]" />Platform fees</span>
          </div>
        }
      />
      <PanelBody>
        <GmvFeesChart days={trend.days} />
        <div className="mt-1 grid grid-cols-2 gap-3 md:grid-cols-4">
          {summary.map(([label, value]) => (
            <div key={label} className="rounded-[10px] bg-muted px-3 py-2.5">
              <span className="block text-[11.5px] text-muted-foreground">{label}</span>
              <b className="text-[15px] tabular-nums">{value}</b>
            </div>
          ))}
        </div>
      </PanelBody>
    </Panel>
  )
}

type Tone = 'primary' | 'accent' | 'danger'

const ICON_TONE: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary-ink',
  accent: 'bg-accent-soft text-accent-ink',
  danger: 'bg-destructive-soft text-destructive'
}

export async function AttentionSection () {
  const counts = await getSidebarCounts()
  const items: Array<{ label: string, hint: string, value: number, href: string, icon: LucideIcon, tone: Tone }> = [
    { label: 'Seller applications', hint: 'Waiting for approval', value: counts.pendingSellers, href: '/sellers?status=pending', icon: UserCheck, tone: 'accent' },
    { label: 'Store top-ups to review', hint: 'Vodafone Cash and InstaPay proofs', value: counts.pendingStoreTopUps, href: '/store-top-ups', icon: Wallet, tone: 'accent' },
    { label: 'Failing domains', hint: 'Custom domains not serving the store', value: counts.failingDomains, href: '/domains?status=failed', icon: ShieldAlert, tone: 'danger' },
    { label: 'Integrations in error', hint: 'Store integrations that stopped', value: counts.integrationErrors, href: '/integrations?tab=errors', icon: PlugZap, tone: 'danger' },
    { label: 'Fulfillment requests', hint: 'Sellers waiting on the service', value: counts.fulfillmentOpenSellers, href: '/fulfillment', icon: Package, tone: 'primary' },
    { label: 'Ad requests', hint: 'Campaigns to review', value: counts.pendingAdRequests, href: '/ad-requests?status=pending', icon: Megaphone, tone: 'primary' }
  ]
  return (
    <Panel>
      <PanelHeader title="Needs attention" description="Items waiting on the admin team" />
      <PanelBody className="pt-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-3 border-t py-[11px] first:border-t-0"
          >
            <span className={cn('grid size-[34px] shrink-0 place-items-center rounded-[10px]', ICON_TONE[item.tone])}>
              <item.icon className="size-4" strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold group-hover:text-primary-ink">{item.label}</span>
              <small className="block truncate text-xs text-muted-foreground">{item.hint}</small>
            </span>
            <span className={cn('ml-auto text-[15px] font-bold tabular-nums', item.value === 0 && 'text-faint')}>
              {num(item.value)}
            </span>
            <ChevronRight className="size-[15px] shrink-0 text-faint" />
          </Link>
        ))}
      </PanelBody>
    </Panel>
  )
}

function Bar ({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[12.5px]">
        <span className="text-muted-foreground">{label}</span>
        <b className="font-semibold tabular-nums">{value}%</b>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <i className={cn('block h-full rounded-full', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export async function MixSection ({ range }: { range: OverviewRange }) {
  const mix = await getOverviewMix(range)
  const sites = [
    { key: 'published', label: 'Published', value: mix.sites.published ?? 0, color: 'bg-primary' },
    { key: 'draft', label: 'Never published', value: mix.sites.draft ?? 0, color: 'bg-secondary' },
    { key: 'unpublished', label: 'Taken offline', value: mix.sites.unpublished ?? 0, color: 'bg-accent' }
  ]
  const storeTotal = sites.reduce((total, site) => total + site.value, 0)
  const signedUp = mix.funnel[0]?.value ?? 0
  const drop = biggestFunnelDrop(mix.funnel)
  const outcomeTotal = mix.outcomes.reduce((total, row) => total + row.value, 0)
  const paymentTotal = mix.payments.reduce((total, row) => total + row.value, 0)
  const outcomeColor: Record<string, string> = {
    delivered: 'bg-success',
    open: 'bg-primary',
    returned: 'bg-accent',
    cancelled: 'bg-destructive'
  }

  return (
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
      <Panel>
        <PanelHeader
          title="Stores"
          description="Every live store, by website status"
          action={<Pill tone="success">{num(storeTotal)} stores</Pill>}
        />
        <PanelBody>
          <div className="mt-1 mb-3.5 flex h-3 gap-0.5 overflow-hidden rounded-full bg-muted">
            {sites.map((site) => site.value > 0 && (
              <i key={site.key} className={cn('block h-full', site.color)} style={{ flex: site.value }} />
            ))}
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2.5 text-[13px]">
            {sites.map((site) => (
              <SiteRow key={site.key} color={site.color} label={site.label} value={`${num(site.value)} stores`} />
            ))}
            <SiteRow color="bg-destructive" label="Suspended" value={`${num(mix.suspendedStores)} stores`} />
          </div>
          <Note className="mt-4">
            Fee trial <b>{num(mix.sellersInTrial)}</b> sellers · Past trial <b>{num(mix.sellersPastTrial)}</b> ·{' '}
            <Link href="/wallets?balance=negative" className="hover:underline">
              Negative wallets <b className={cn(mix.negativeWallets > 0 && 'text-destructive!')}>{num(mix.negativeWallets)}</b>
              {mix.negativeWallets > 0 && <> ({money(mix.negativeTotal)})</>}
            </Link>
          </Note>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title="Seller activation" description="Sellers who signed up this period, by step reached" />
        <PanelBody>
          <div className="flex flex-col gap-2.5">
            {mix.funnel.map((step) => {
              const share = sharePercent(step.value, signedUp)
              return (
                <div key={step.key} className="grid grid-cols-[110px_minmax(0,1fr)_48px] items-center gap-3 text-[12.5px]">
                  <span className="text-muted-foreground">{step.label}</span>
                  <div>
                    <div
                      className="flex h-[26px] min-w-11 items-center rounded-[7px] bg-primary px-2.5 text-xs font-semibold text-primary-foreground tabular-nums"
                      style={{ width: `${signedUp > 0 ? share : 0}%` }}
                    >
                      {num(step.value)}
                    </div>
                  </div>
                  <em className="text-right text-xs text-muted-foreground not-italic tabular-nums">{Math.round(share)}%</em>
                </div>
              )
            })}
          </div>
          <Note className="mt-4">
            {drop
              ? <>Biggest drop: <b>{drop.from.toLowerCase()} → {drop.to.toLowerCase()}</b> ({Math.round(drop.lost * 100)}% lost).</>
              : 'No seller sign-ups in this period.'}
          </Note>
        </PanelBody>
      </Panel>

      <Panel className="lg:col-span-2 xl:col-span-1">
        <PanelHeader title="Order outcomes" description="Orders placed this period, by current status" />
        <PanelBody>
          <div className="flex flex-col gap-3.5">
            {mix.outcomes.map((row) => (
              <Bar
                key={row.key}
                label={row.label}
                value={sharePercent(row.value, outcomeTotal)}
                color={outcomeColor[row.key] ?? 'bg-primary'}
              />
            ))}
          </div>
          <Note className="mt-4">
            {paymentTotal > 0
              ? <>Payment mix: {mix.payments.slice(0, 3).map((row, i) => {
                  const text = `${row.label} ${Math.round(sharePercent(row.value, paymentTotal))}%`
                  return (
                    <span key={row.label}>
                      {i > 0 && ' · '}
                      {i === 0 ? <b>{text}</b> : text}
                    </span>
                  )
                })}</>
              : 'No orders in this period.'}
          </Note>
        </PanelBody>
      </Panel>
    </section>
  )
}

function SiteRow ({ color, label, value }: { color: string, label: string, value: string }) {
  return (
    <>
      <span className="flex items-center gap-2 text-muted-foreground">
        <i className={cn('size-2 shrink-0 rounded-[2px]', color)} />
        {label}
      </span>
      <b className="text-right font-semibold tabular-nums">{value}</b>
    </>
  )
}

const LOGO_COLORS = ['#145163', '#b7791f', '#2f6f62', '#8a4f5a', '#3d5a80', '#6b5b3e']

function StoreLogo ({ name, logoUrl, index }: { name: string, logoUrl: string | null, index: number }) {
  if (logoUrl) {
    return (
      <RemoteImage
        src={logoUrl}
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-[9px] border object-cover"
      />
    )
  }
  return (
    <span
      className="grid size-8 shrink-0 place-items-center rounded-[9px] text-xs font-bold text-white"
      style={{ background: LOGO_COLORS[index % LOGO_COLORS.length] }}
    >
      {initials(name) || '?'}
    </span>
  )
}

export async function StoresSection ({ range }: { range: OverviewRange }) {
  const { top, latest } = await getOverviewStores(range)
  const th = 'px-2.5 pb-2.5 text-xs font-medium whitespace-nowrap text-muted-foreground first:pl-0 last:pr-0'
  const td = 'border-t px-2.5 py-[11px] whitespace-nowrap tabular-nums first:pl-0 last:pr-0'

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Panel>
        <PanelHeader
          title="Top stores"
          description="Ranked by GMV in this period"
          action={<Link href="/stores" className="text-[13px] font-semibold text-primary-ink hover:underline">View all stores</Link>}
        />
        <PanelBody className="overflow-x-auto">
          {top.length === 0
            ? <p className="py-8 text-sm text-muted-foreground">No store orders in this period.</p>
            : (
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="text-left">
                    <th className={th}>Store</th>
                    <th className={th}>Website</th>
                    <th className={cn(th, 'text-right')}>Orders</th>
                    <th className={cn(th, 'text-right')}>GMV</th>
                    <th className={cn(th, 'text-right')}>Growth</th>
                    <th className={cn(th, 'text-right')}>Delivery rate</th>
                    <th className={cn(th, 'text-right')}>Wallet</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map((store, i) => (
                    <tr key={store.id}>
                      <td className={td}>
                        <Link href={`/stores/${store.id}`} className="group flex items-center gap-2.5">
                          <StoreLogo name={store.name} logoUrl={store.logoUrl} index={i} />
                          <span>
                            <b className="block text-[13px] font-semibold group-hover:text-primary-ink">{store.name}</b>
                            <small className="text-[11.5px] text-muted-foreground" dir="ltr">
                              {storeHostname(store.subdomain, store.customDomain)}
                            </small>
                          </span>
                        </Link>
                      </td>
                      <td className={td}><Pill tone={SITE_TONE[store.siteStatus] ?? 'neutral'}>{store.siteStatus}</Pill></td>
                      <td className={cn(td, 'text-right')}>{num(store.orders)}</td>
                      <td className={cn(td, 'text-right')}><b>{num(store.gmv)}</b> EGP</td>
                      <td className={cn(td, 'text-right')}>
                        {store.growthPercent == null
                          ? <span className="text-faint">New</span>
                          : (
                            <span className={cn('font-semibold', store.growthPercent >= 0 ? 'text-success' : 'text-destructive')}>
                              {store.growthPercent >= 0 ? '+' : ''}{store.growthPercent}%
                            </span>
                            )}
                      </td>
                      <td className={cn(td, 'text-right')}>{store.deliveryRate == null ? <span className="text-faint">—</span> : `${store.deliveryRate}%`}</td>
                      <td className={cn(td, 'text-right')}>
                        {store.walletBalance == null
                          ? <span className="text-faint">—</span>
                          : store.walletBalance < 0
                            ? <Pill tone="danger">{money(store.walletBalance)}</Pill>
                            : money(store.walletBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader
          title="New stores"
          description="Latest stores created"
          action={<Link href="/stores" className="text-[13px] font-semibold text-primary-ink hover:underline">All</Link>}
        />
        <PanelBody>
          {latest.length === 0 && <p className="py-8 text-sm text-muted-foreground">No stores yet.</p>}
          {latest.map((store, i) => (
            <Link
              key={store.id}
              href={`/stores/${store.id}`}
              className="group flex items-center gap-3 border-t py-2.5 first:border-t-0 first:pt-0"
            >
              <StoreLogo name={store.name} logoUrl={store.logoUrl} index={i + 2} />
              <span className="min-w-0">
                <b className="block truncate text-[13px] font-semibold group-hover:text-primary-ink">{store.name}</b>
                <small className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="truncate">{[store.category, store.sellerName].filter(Boolean).join(' · ') || 'No category'}</span>
                  <Pill tone={SITE_TONE[store.siteStatus] ?? 'neutral'}>{store.siteStatus}</Pill>
                </small>
              </span>
              <time className="ml-auto text-[11.5px] whitespace-nowrap text-faint" dateTime={store.createdAt}>
                {relativeTime(store.createdAt)}
              </time>
            </Link>
          ))}
        </PanelBody>
      </Panel>
    </section>
  )
}
