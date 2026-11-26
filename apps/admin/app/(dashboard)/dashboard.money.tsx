import Link from 'next/link'
import { cn } from '@workspace/ui/lib/utils'
import { getLargestWallets, getOverviewMoney } from '@/lib/analytics/overview-money.server'
import type { OverviewPeriod } from '@/lib/analytics/overview.types'
import { topUpProviderLabel } from './wallets/store-wallets.lib'
import {
  cairoDay,
  Empty,
  money,
  Note,
  num,
  Panel,
  PanelBody,
  PanelHeader,
  Pill,
  Signed,
  storeWallet,
  td,
  th
} from './dashboard.ui'

/**
 * Money panels of the admin home: top-ups by provider, manual wallet credits
 * from the dashboard, recent top-ups and the largest wallets. Read-only;
 * nothing here writes to a wallet.
 */

function SellerCell ({ sellerId, sellerName, storeName }: { sellerId: string, sellerName: string, storeName: string | null }) {
  return (
    <Link href={`/sellers/${sellerId}`} className="group block max-w-[220px]">
      <b className="block truncate text-[13px] font-semibold group-hover:text-primary-ink">{sellerName}</b>
      {storeName && storeName !== sellerName && (
        <small className="block truncate text-[11.5px] text-muted-foreground">{storeName}</small>
      )}
    </Link>
  )
}

const viewLink = 'text-[13px] font-semibold whitespace-nowrap text-primary-ink hover:underline'

export async function TopUpsSection ({ period }: { period: OverviewPeriod }) {
  const { providers } = await getOverviewMoney(period)
  const kashier = providers.find((row) => row.provider === 'kashier')
  const pending = providers.reduce((total, row) => total + row.pending, 0)
  const failed = providers.reduce((total, row) => total + row.failed, 0)

  return (
    <Panel>
      <PanelHeader
        title="Wallet top-ups"
        description="Started this period, by method"
        action={<Link href="/wallets?tab=topups" className={viewLink}>All top-ups</Link>}
      />
      <PanelBody className="overflow-x-auto">
        {providers.length === 0
          ? <Empty>No top-ups started in this period.</Empty>
          : (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="text-left">
                  <th className={th}>Method</th>
                  <th className={cn(th, 'text-right')}>Paid</th>
                  <th className={cn(th, 'text-right')}>EGP</th>
                  <th className={cn(th, 'text-right')}>USD</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((row) => (
                  <tr key={row.provider}>
                    <td className={td}>
                      <span className="block font-semibold">{topUpProviderLabel(row.provider)}</span>
                      {(row.failed > 0 || row.pending > 0) && (
                        <small className="text-[11.5px] text-muted-foreground">
                          {num(row.failed)} failed · {num(row.pending)} pending
                        </small>
                      )}
                    </td>
                    <td className={cn(td, 'text-right')}>{num(row.succeeded)}</td>
                    <td className={cn(td, 'text-right')}>{money(row.paid)}</td>
                    <td className={cn(td, 'text-right')}>{storeWallet(row.credited, 'USD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
        <Note className="mt-4">
          Kashier conversion{' '}
          <b>{kashier?.conversion == null ? '—' : `${kashier.conversion}%`}</b>
          {kashier && <> ({num(kashier.succeeded)} of {num(kashier.succeeded + kashier.failed + kashier.pending)} started)</>}
          {' '}· Failed <b className={cn(failed > 0 && 'text-destructive!')}>{num(failed)}</b> · Pending <b>{num(pending)}</b>
        </Note>
      </PanelBody>
    </Panel>
  )
}

export async function CreditsSection ({ period }: { period: OverviewPeriod }) {
  const { credits, fiveDollar } = await getOverviewMoney(period)

  return (
    <Panel>
      <PanelHeader
        title="Manual credits from the dashboard"
        description={
          <>
            <b className="font-semibold text-foreground">$5 credits (all time): {num(fiveDollar.sellers)} sellers</b> ·{' '}
            <b className={cn('font-semibold', fiveDollar.paidSince > 0 ? 'text-success' : 'text-foreground')}>
              {num(fiveDollar.paidSince)} paid a top-up afterwards
            </b>
          </>
        }
        action={<Link href="/wallets?tab=ledger&type=adjustment" className={viewLink}>View ledger</Link>}
      />
      <PanelBody className="overflow-x-auto">
        <h4 className="mb-2 text-[13px] font-semibold">
          Every $5 credit <span className="font-normal text-muted-foreground">· all time, newest first</span>
        </h4>
        {fiveDollar.credits.length === 0
          ? <Empty>No $5 credits from the dashboard yet.</Empty>
          : (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="text-left">
                  <th className={th}>Seller</th>
                  <th className={th}>Date</th>
                  <th className={th}>By</th>
                  <th className={cn(th, 'text-right')}>Wallet now</th>
                  <th className={th}>Topped up since</th>
                </tr>
              </thead>
              <tbody>
                {fiveDollar.credits.map((row) => (
                  <tr key={row.id}>
                    <td className={td}><SellerCell sellerId={row.sellerId} sellerName={row.sellerName} storeName={row.storeName} /></td>
                    <td className={td}><time dateTime={row.createdAt}>{cairoDay(row.createdAt)}</time></td>
                    <td className={cn(td, 'max-w-[180px] truncate text-muted-foreground')}>{row.adminName ?? 'System'}</td>
                    <td className={cn(td, 'text-right')}>
                      {row.walletBalance == null
                        ? <span className="text-faint">—</span>
                        : <span className={cn(row.walletBalance < 0 && 'text-destructive')}>{storeWallet(row.walletBalance, row.walletCurrency)}</span>}
                    </td>
                    <td className={td}>{row.paidSince ? <Pill tone="success">Yes</Pill> : <Pill>No</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}

        <h4 className="mt-6 mb-2 text-[13px] font-semibold">
          All admin wallet changes <span className="font-normal text-muted-foreground">· this period, latest 10</span>
        </h4>
        {credits.length === 0
          ? <Empty>No manual wallet changes in this period.</Empty>
          : (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="text-left">
                  <th className={th}>Seller</th>
                  <th className={cn(th, 'text-right')}>Amount</th>
                  <th className={th}>Reason</th>
                  <th className={th}>By</th>
                  <th className={th}>Date</th>
                  <th className={cn(th, 'text-right')}>Wallet now</th>
                  <th className={th}>Top-up since</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((row) => (
                  <tr key={row.id}>
                    <td className={td}><SellerCell sellerId={row.sellerId} sellerName={row.sellerName} storeName={row.storeName} /></td>
                    <td className={cn(td, 'text-right')}>
                      <span className="inline-flex items-center gap-1.5">
                        {row.currency === 'USD' && row.amount === 5 && <Pill tone="primary">$5</Pill>}
                        <Signed value={row.amount} currency={row.currency} />
                      </span>
                    </td>
                    <td className={cn(td, 'max-w-[240px] truncate text-muted-foreground')} title={row.reason ?? undefined}>
                      {row.reason ?? '—'}
                    </td>
                    <td className={cn(td, 'max-w-[180px] truncate text-muted-foreground')}>{row.adminName ?? 'System'}</td>
                    <td className={td}>
                      <time dateTime={row.createdAt}>{cairoDay(row.createdAt)}</time>
                    </td>
                    <td className={cn(td, 'text-right')}>
                      {row.walletBalance == null
                        ? <span className="text-faint">—</span>
                        : <span className={cn(row.walletBalance < 0 && 'text-destructive')}>{storeWallet(row.walletBalance, row.walletCurrency)}</span>}
                    </td>
                    <td className={td}>
                      {row.paidSince ? <Pill tone="success">Yes</Pill> : <Pill>No</Pill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
      </PanelBody>
    </Panel>
  )
}

export async function RecentTopUpsSection ({ period }: { period: OverviewPeriod }) {
  const { recentTopUps } = await getOverviewMoney(period)

  return (
    <Panel>
      <PanelHeader
        title="Recent top-ups"
        description="Succeeded this period, newest first"
        action={<Link href="/wallets?tab=topups&status=succeeded" className={viewLink}>View all</Link>}
      />
      <PanelBody className="overflow-x-auto">
        {recentTopUps.length === 0
          ? <Empty>No succeeded top-ups in this period.</Empty>
          : (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="text-left">
                  <th className={th}>Seller</th>
                  <th className={th}>Method</th>
                  <th className={cn(th, 'text-right')}>Paid</th>
                  <th className={cn(th, 'text-right')}>Credited</th>
                  <th className={th}>Date</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {recentTopUps.map((row) => (
                  <tr key={row.id}>
                    <td className={td}><SellerCell sellerId={row.sellerId} sellerName={row.sellerName} storeName={row.storeName} /></td>
                    <td className={cn(td, 'text-muted-foreground')}>{topUpProviderLabel(row.provider)}</td>
                    <td className={cn(td, 'text-right')}>{money(row.paid)}</td>
                    <td className={cn(td, 'text-right')}>
                      {row.credited == null || !row.creditCurrency
                        ? <span className="text-faint">—</span>
                        : <b className="font-semibold text-success">{storeWallet(row.credited, row.creditCurrency)}</b>}
                    </td>
                    <td className={td}><time dateTime={row.createdAt}>{cairoDay(row.createdAt)}</time></td>
                    <td className={td}>{row.first && <Pill tone="success">First top-up</Pill>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
      </PanelBody>
    </Panel>
  )
}

export async function LeadersSection () {
  const leaders = await getLargestWallets()

  return (
    <Panel>
      <PanelHeader
        title="Largest wallet balances"
        description="Right now, above zero"
        action={<Link href="/wallets?balance=positive" className={viewLink}>All</Link>}
      />
      <PanelBody>
        {leaders.length === 0 && <Empty>No wallet above zero.</Empty>}
        {leaders.map((row) => (
          <div key={row.sellerId} className="flex items-center gap-3 border-t py-2.5 first:border-t-0 first:pt-0">
            <SellerCell sellerId={row.sellerId} sellerName={row.sellerName} storeName={row.storeName} />
            {!row.paidTopUp && <Pill tone="accent">Credit only</Pill>}
            <b className="ml-auto text-[14px] font-bold tabular-nums">{storeWallet(row.balance, row.currency)}</b>
          </div>
        ))}
      </PanelBody>
    </Panel>
  )
}
