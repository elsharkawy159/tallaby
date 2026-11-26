import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  Activity,
  Banknote,
  ChevronRight,
  CircleDollarSign,
  Globe,
  HandCoins,
  Landmark,
  Megaphone,
  Package,
  PackageCheck,
  PlugZap,
  Receipt,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Store,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon
} from 'lucide-react'
import { getBillingState } from '@workspace/lib/billing/server'
import { storeHostname } from '@workspace/lib/storefront'
import { cn } from '@workspace/ui/lib/utils'
import { RemoteImage } from '@/components/media/remote-image'
import {
  getOverviewMix,
  getOverviewSnapshot,
  getOverviewStores,
  getOverviewTrend
} from '@/lib/analytics/overview.server'
import {
  biggestFunnelDrop,
  initials,
  sharePercent,
  sparkSeries
} from '@/lib/analytics/overview.lib'
import type { OverviewKpi, OverviewPeriod } from '@/lib/analytics/overview.types'
import { getSidebarCounts } from './_components/layout/sidebar.server'
import { relativeTime } from './_components/layout/notification-bell.lib'
import { GmvFeesChart, GrowthChart } from './dashboard-chart.client'
import {
  Delta,
  Empty,
  money,
  Note,
  num,
  Panel,
  PanelBody,
  PanelHeader,
  Pill,
  SITE_TONE,
  Sparkline,
  storeWallet,
  td,
  th
} from './dashboard.ui'

/**
 * The admin home ("Platform overview"). Each export is an async Server
 * Component owning one query; page.tsx wraps each in its own Suspense boundary
 * so a slow aggregate delays only its cards. Money panels: dashboard.money.tsx.
 */

/* ── Right now ─────────────────────────────────────────────────────────── */

function SnapshotTile ({ title, icon: Icon, href, value, unit, children }: {
  title: string
  icon: LucideIcon
  href: string
  value: string
  unit?: string
  children: ReactNode
}) {
  return (
    <Panel className="gap-1.5 px-[18px] py-4">
      <Link href={href} className="group flex items-center justify-between text-[12.5px] font-medium text-muted-foreground hover:text-foreground">
        {title}
        <Icon className="size-4 text-faint group-hover:text-primary-ink" strokeWidth={1.75} />
      </Link>
      <Link href={href} className="w-fit text-2xl font-bold tracking-tight tabular-nums hover:text-primary-ink">
        {value}
        {unit && <small className="ml-1 text-[13px] font-semibold text-muted-foreground">{unit}</small>}
      </Link>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground tabular-nums [&_a:hover]:text-foreground [&_a:hover]:underline [&_b]:font-semibold [&_b]:text-foreground">
        {children}
      </div>
    </Panel>
  )
}

const pct = (value: number, total: number) => `${Math.round(sharePercent(value, total))}%`

export async function SnapshotSection () {
  const snap = await getOverviewSnapshot()
  const { stores, sellers, pendingTopUps } = snap
  const [main, ...others] = snap.wallets
  return (
    <section aria-labelledby="snapshot-title" className="flex flex-col gap-2.5">
      <h3 id="snapshot-title" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Right now</h3>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <SnapshotTile title="Live stores" icon={Store} href="/stores" value={num(stores.total)}>
          <span>
            <Link href="/stores?site=published"><b>{num(stores.published)}</b> published</Link>{' '}
            <span className="text-faint">({pct(stores.published, stores.total)})</span>
          </span>
          <span>
            <Link href="/stores?site=draft"><b>{num(stores.neverPublished)}</b> never published</Link> ·{' '}
            <Link href="/stores?site=unpublished"><b>{num(stores.offline)}</b> offline</Link> ·{' '}
            <Link href="/stores?status=suspended">
              <b className={cn(stores.suspended > 0 && 'text-destructive!')}>{num(stores.suspended)}</b> suspended
            </Link>
          </span>
        </SnapshotTile>

        <SnapshotTile title="Sellers" icon={Users} href="/sellers" value={num(sellers.total)}>
          <span>
            <b>{num(sellers.activated)}</b> activated <span className="text-faint">({pct(sellers.activated, sellers.total)})</span>
          </span>
          <span>
            <b className="text-success!">{num(sellers.paidTopUp)}</b> paid a top-up · <b>{num(sellers.creditOnly)}</b> by admin credit only
          </span>
        </SnapshotTile>

        <SnapshotTile
          title="Held in store wallets"
          icon={Wallet}
          href="/wallets?balance=positive"
          value={main ? storeWallet(main.positiveTotal, main.currency) : storeWallet(0, 'USD')}
        >
          {main
            ? (
              <>
                <span>
                  <Link href="/wallets?balance=positive"><b>{num(main.positiveCount)}</b> wallets above zero</Link> · net{' '}
                  <b>{storeWallet(main.positiveTotal + main.negativeTotal, main.currency)}</b>
                </span>
                <span>
                  <Link href="/wallets?balance=negative" className={cn(main.negativeCount > 0 && 'text-destructive')}>
                    <b className={cn(main.negativeCount > 0 && 'text-destructive!')}>{num(main.negativeCount)}</b> below zero
                    {main.negativeCount > 0 && <> ({storeWallet(main.negativeTotal, main.currency)})</>}
                  </Link>
                </span>
                {others.map((w) => (
                  <span key={w.currency}>
                    {w.currency}: <b>{storeWallet(w.positiveTotal, w.currency)}</b> held · {num(w.wallets)} wallets
                  </span>
                ))}
              </>
              )
            : <span>No store wallets yet.</span>}
        </SnapshotTile>

        <SnapshotTile title="Top-ups awaiting review" icon={Receipt} href="/store-top-ups" value={num(pendingTopUps.count)}>
          <span><b>{money(pendingTopUps.amount)}</b> paid by sellers, waiting for a proof check</span>
          <span>
            <Link href="/store-top-ups">Review InstaPay and wallet proofs</Link>
          </span>
        </SnapshotTile>
      </div>
    </section>
  )
}

/* ── Period KPIs ───────────────────────────────────────────────────────── */

function KpiTile ({ title, icon: Icon, value, unit, metric, hint, spark, href }: {
  title: string
  icon: LucideIcon
  value: string
  unit?: string
  metric: OverviewKpi
  hint?: ReactNode
  spark?: number[]
  href: string
}) {
  return (
    <Link href={href} className="group">
      <Panel className="h-full gap-1 px-4 py-3.5 transition-colors group-hover:border-primary/40">
        <div className="flex items-center justify-between gap-2 text-[12.5px] font-medium text-muted-foreground">
          <span className="truncate">{title}</span>
          <Icon className="size-4 shrink-0 text-faint" strokeWidth={1.75} />
        </div>
        <div className="flex items-end justify-between gap-2">
          <div className="text-[22px] font-bold tracking-tight tabular-nums">
            {value}
            {unit && <small className="ml-1 text-[12px] font-semibold text-muted-foreground">{unit}</small>}
          </div>
          {spark && <Sparkline values={spark} up={metric.changePercent >= 0} />}
        </div>
        <div className="text-xs text-muted-foreground tabular-nums" title={`Previous period: ${metric.previous.toLocaleString('en-US')}`}>
          <Delta metric={metric} /> <span className="text-faint">vs {num(metric.previous)}</span>
        </div>
        {hint && <div className="truncate text-[11.5px] text-muted-foreground">{hint}</div>}
      </Panel>
    </Link>
  )
}

export async function KpiSection ({ period }: { period: OverviewPeriod }) {
  const [trend, billing] = await Promise.all([getOverviewTrend(period), getBillingState()])
  const p = trend.points
  return (
    <section aria-labelledby="period-title" className="flex flex-col gap-2.5">
      <h3 id="period-title" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {period.label} · {period.rangeLabel}
      </h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        <KpiTile title="GMV (EGP orders)" icon={Banknote} value={num(trend.gmv.current)} unit="EGP" metric={trend.gmv} spark={sparkSeries(p, 'gmv')} href="/orders" />
        <KpiTile title="Orders" icon={ShoppingCart} value={num(trend.orders.current)} metric={trend.orders} spark={sparkSeries(p, 'orders')} href="/orders" />
        <KpiTile
          title="Platform fees"
          icon={Landmark}
          value={num(trend.fees.current)}
          unit="EGP"
          metric={trend.fees}
          spark={sparkSeries(p, 'fees')}
          hint={billing.usdLive ? '$0.03 per order on Free, in EGP' : 'EGP 5 per order'}
          href="/wallets?tab=ledger&type=fee"
        />
        <KpiTile title="Average order" icon={Receipt} value={num(trend.averageOrder.current)} unit="EGP" metric={trend.averageOrder} href="/orders" />
        <KpiTile title="Active stores" icon={Activity} value={num(trend.activeStores.current)} metric={trend.activeStores} hint="≥1 counted order" href="/stores" />
        <KpiTile title="Delivered orders" icon={PackageCheck} value={num(trend.deliveredOrders.current)} metric={trend.deliveredOrders} href="/orders" />
        <KpiTile title="New sellers" icon={UserPlus} value={num(trend.newSellers.current)} metric={trend.newSellers} spark={sparkSeries(p, 'newSellers')} href="/sellers" />
        <KpiTile title="New stores" icon={Sparkles} value={num(trend.newStores.current)} metric={trend.newStores} spark={sparkSeries(p, 'newStores')} href="/stores" />
        <KpiTile
          title="Published first time"
          icon={Globe}
          value={num(trend.firstPublished.current)}
          metric={trend.firstPublished}
          spark={sparkSeries(p, 'firstPublished')}
          href="/stores?site=published"
        />
        <KpiTile
          title="Top-ups"
          icon={CircleDollarSign}
          value={num(trend.topUps.current)}
          metric={trend.topUps}
          spark={sparkSeries(p, 'topUps')}
          hint={<>{num(trend.topUpSellers)} sellers · {money(trend.topUpPaid.current)} · {storeWallet(trend.topUpCredited, 'USD')} · {num(trend.firstTopUps)} first</>}
          href="/wallets?tab=topups&status=succeeded"
        />
        <KpiTile
          title="Admin credits"
          icon={HandCoins}
          value={num(trend.adminCredits.current)}
          metric={trend.adminCredits}
          hint={<>{num(trend.adminCreditSellers)} sellers · net {storeWallet(trend.adminCreditNet, 'USD')}</>}
          href="/wallets?tab=ledger&type=adjustment"
        />
        <KpiTile
          title="Newly activated"
          icon={UserCheck}
          value={num(trend.newlyActivated.current)}
          metric={trend.newlyActivated}
          hint="First top-up or credit"
          href="/sellers"
        />
      </div>
    </section>
  )
}

/* ── Charts ────────────────────────────────────────────────────────────── */

const BUCKET_WORD: Record<OverviewPeriod['bucket'], string> = { hour: 'hour', day: 'day', week: 'week' }

export async function TrendSection ({ period }: { period: OverviewPeriod }) {
  const trend = await getOverviewTrend(period)
  const summary: Array<[string, string]> = [
    ['Platform fees', money(trend.fees.current)],
    ['Delivered orders', num(trend.deliveredOrders.current)],
    ['Average order', money(trend.averageOrder.current)],
    ['Top-ups paid', money(trend.topUpPaid.current)]
  ]
  return (
    <Panel>
      <PanelHeader
        title="GMV (EGP orders) and platform fees"
        description={`Per ${BUCKET_WORD[period.bucket]}, Cairo time: merchant sales vs what Tallaby earned`}
        action={
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span><i className="mr-1.5 inline-block size-2.5 rounded-[3px] bg-primary align-[-1px]" />GMV</span>
            <span><i className="mr-1.5 inline-block size-2.5 rounded-[3px] bg-accent align-[-1px]" />Platform fees</span>
          </div>
        }
      />
      <PanelBody>
        <GmvFeesChart points={trend.points} />
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

export async function GrowthSection ({ period }: { period: OverviewPeriod }) {
  const trend = await getOverviewTrend(period)
  return (
    <Panel>
      <PanelHeader
        title="Growth"
        description={`Per ${BUCKET_WORD[period.bucket]}: sign-ups, new stores, first publishes and succeeded top-ups`}
      />
      <PanelBody className="pt-2">
        <GrowthChart points={trend.points} />
      </PanelBody>
    </Panel>
  )
}

/* ── Needs attention ───────────────────────────────────────────────────── */

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

/* ── Funnel and order outcomes ─────────────────────────────────────────── */

function Bar ({ label, value, count, color }: { label: string, value: number, count: number, color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[12.5px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums"><span className="text-faint">{num(count)} · </span><b className="font-semibold">{value}%</b></span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <i className={cn('block h-full rounded-full', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export async function MixSection ({ period }: { period: OverviewPeriod }) {
  const mix = await getOverviewMix(period)
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
    <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Panel>
        <PanelHeader title="Seller activation" description="Sellers who signed up this period, by step reached so far" />
        <PanelBody>
          <div className="flex flex-col gap-2.5">
            {mix.funnel.map((step) => {
              const share = sharePercent(step.value, signedUp)
              return (
                <div key={step.key} className="grid grid-cols-[104px_minmax(0,1fr)_44px] items-center gap-3 text-[12.5px]">
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
              ? <>Biggest drop: <b>{drop.from.toLowerCase()} → {drop.to.toLowerCase()}</b> ({Math.round(drop.lost * 100)}% lost). “Activated” means a top-up or a wallet credit, by the order-lock rule.</>
              : 'No seller sign-ups in this period.'}
          </Note>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title="Order outcomes" description="Orders placed this period, by current status" />
        <PanelBody>
          {outcomeTotal === 0
            ? <Empty>No orders in this period.</Empty>
            : (
              <div className="flex flex-col gap-3.5">
                {mix.outcomes.map((row) => (
                  <Bar
                    key={row.key}
                    label={row.label}
                    count={row.value}
                    value={sharePercent(row.value, outcomeTotal)}
                    color={outcomeColor[row.key] ?? 'bg-primary'}
                  />
                ))}
              </div>
              )}
          <Note className="mt-4">
            {paymentTotal > 0
              ? <>Payment mix: {mix.payments.slice(0, 4).map((row, i) => {
                  const text = `${row.label} ${Math.round(sharePercent(row.value, paymentTotal))}%`
                  return (
                    <span key={row.label}>
                      {i > 0 && ' · '}
                      {i === 0 ? <b>{text}</b> : text}
                    </span>
                  )
                })}</>
              : 'No counted orders in this period.'}
          </Note>
        </PanelBody>
      </Panel>
    </section>
  )
}

/* ── Stores ────────────────────────────────────────────────────────────── */

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

export async function StoresSection ({ period }: { period: OverviewPeriod }) {
  const { top, latest } = await getOverviewStores(period)

  return (
    <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Panel>
        <PanelHeader
          title="Top stores"
          description="Ranked by GMV in this period, growth vs the previous one"
          action={<Link href="/stores" className="text-[13px] font-semibold text-primary-ink hover:underline">View all stores</Link>}
        />
        <PanelBody className="overflow-x-auto">
          {top.length === 0
            ? <Empty>No store orders in this period.</Empty>
            : (
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="text-left">
                    <th className={th}>Store</th>
                    <th className={th}>Website</th>
                    <th className={cn(th, 'text-right')}>Orders</th>
                    <th className={cn(th, 'text-right')}>GMV (EGP)</th>
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
                      <td className={td}><Pill tone={SITE_TONE[store.siteStatus] ?? 'neutral'} className="capitalize">{store.siteStatus}</Pill></td>
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
                            ? <Pill tone="danger">{storeWallet(store.walletBalance, store.walletCurrency)}</Pill>
                            : storeWallet(store.walletBalance, store.walletCurrency)}
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
          {latest.length === 0 && <Empty>No stores yet.</Empty>}
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
                  <Pill tone={SITE_TONE[store.siteStatus] ?? 'neutral'} className="capitalize">{store.siteStatus}</Pill>
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
