import Link from "next/link";
import { parseAdminPage } from "@workspace/lib/tallaby-pay";
import type { TallabyPayAdminPayoutRow } from "@workspace/lib/tallaby-pay/server";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import { loadTallabyPayPayouts } from "../tallaby-pay.data";
import {
  KYC_STATUS_LABEL,
  PAYOUT_STATUS_LABEL,
  cairoTime,
  destinationLines,
  egpAmount,
  filterHref,
  isNegativeAmount,
} from "../tallaby-pay.lib";
import { EmptyState, LoadError, Pager, Tone } from "../tallaby-pay.ui";
import { PayoutQueueActions, ReversePayoutAction } from "./payouts.client";

export const dynamic = "force-dynamic";

/** Why Mark paid would be refused for this request, or null. The server checks both again under its lock. */
function payBlock(r: TallabyPayAdminPayoutRow): string | null {
  if (r.wallet.status !== "active") return "Earnings are frozen: unfreeze them in Wallets, or reject.";
  if (Number(r.wallet.available) < Number(r.amount)) return "Available earnings are below this amount now (a refund since). Reject it.";
  return null;
}

function Destination({ row }: { row: TallabyPayAdminPayoutRow }) {
  if (!row.destination) return <p className="text-sm text-destructive">The saved destination can&apos;t be read. Reject and ask for a new request.</p>;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      {destinationLines(row.destination).map((line) => (
        <div key={line.label} className="contents">
          <dt className="text-muted-foreground">{line.label}</dt>
          <dd className={cn("break-all", line.mono && "font-mono")} dir={line.mono ? "ltr" : undefined}>
            {line.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function QueueCard({ row }: { row: TallabyPayAdminPayoutRow }) {
  const block = payBlock(row);
  // The request needed a verified identity; a later rejection or revocation is a reason to reject it.
  const kycWarning = row.kyc?.status === "verified" ? null : "The identity is no longer verified. Check before paying.";
  const amount = egpAmount(row.amount);
  const kycTone = row.kyc?.status === "verified" ? "success" : row.kyc?.status === "rejected" ? "danger" : "warning";
  return (
    <Card>
      <CardContent className="grid gap-5 py-5 lg:grid-cols-[1fr_1.2fr_1fr]">
        <div className="space-y-1">
          <p className="text-2xl font-bold tabular-nums">{amount}</p>
          <p className="text-sm text-muted-foreground">Asked {cairoTime(row.createdAt)}</p>
          <Link href={`/stores/${row.storeId}`} className="block font-medium hover:underline">
            {row.storeName}
          </Link>
          <Link href={`/sellers/${row.sellerId}`} className="block text-sm text-muted-foreground hover:underline">
            {row.sellerName}
            {row.sellerEmail && ` · ${row.sellerEmail}`}
          </Link>
        </div>
        <div className="space-y-3">
          <Destination row={row} />
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Identity</span>
            <Tone tone={kycTone}>{row.kyc ? KYC_STATUS_LABEL[row.kyc.status] : "Not sent"}</Tone>
            {row.kyc && <span>{row.kyc.legalName}</span>}
          </div>
        </div>
        <div className="space-y-3">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Available</dt>
            <dd className={cn("tabular-nums", isNegativeAmount(row.wallet.available) && "text-destructive")}>
              {egpAmount(row.wallet.available)}
            </dd>
            <dt className="text-muted-foreground">Pending</dt>
            <dd className="tabular-nums">{egpAmount(row.wallet.pending)}</dd>
            <dt className="text-muted-foreground">Refunded sales</dt>
            <dd className="tabular-nums">
              <Link href={`/tallaby-pay/sales?store=${row.storeId}&status=refunded`} className="hover:underline">
                {row.refundedSales}
              </Link>
            </dd>
          </dl>
          <PayoutQueueActions payoutId={row.id} amount={amount} canPay={block === null} blockReason={block ?? kycWarning} />
        </div>
      </CardContent>
    </Card>
  );
}

/** Open withdrawal requests (oldest first) and the history, with Reverse for a paid transfer that came back. */
export default async function TallabyPayPayoutsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = parseAdminPage((await searchParams).page);
  const result = await loadTallabyPayPayouts(page);
  if (!result.data) return <LoadError error={result.error} />;
  const { queue, history } = result.data;

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-labelledby="tp-queue">
        <div>
          <h2 id="tp-queue" className="text-lg font-semibold">
            Waiting to be paid
          </h2>
          <p className="text-sm text-muted-foreground">
            Send the money to the destination shown, in the verified legal name, then mark it paid with the transfer reference.
          </p>
        </div>
        {queue.length === 0 ? (
          <EmptyState>No withdrawal is waiting.</EmptyState>
        ) : (
          queue.map((row) => <QueueCard key={row.id} row={row} />)
        )}
      </section>

      <section className="space-y-3" aria-labelledby="tp-history">
        <h2 id="tp-history" className="text-lg font-semibold">
          History
        </h2>
        {history.rows.length === 0 ? (
          <EmptyState>No withdrawal was handled yet.</EmptyState>
        ) : (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead className="text-end">Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reference or reason</TableHead>
                    <TableHead>Handled</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Link href={`/stores/${r.storeId}`} className="font-medium hover:underline">
                          {r.storeName}
                        </Link>
                        <span className="block text-xs text-muted-foreground">{r.sellerName}</span>
                      </TableCell>
                      <TableCell className="text-end tabular-nums">{egpAmount(r.amount)}</TableCell>
                      <TableCell>
                        <Tone tone={r.status === "paid" ? "success" : r.status === "cancelled" ? "neutral" : "danger"}>
                          {PAYOUT_STATUS_LABEL[r.status]}
                        </Tone>
                      </TableCell>
                      <TableCell className="max-w-72 text-sm">
                        {r.status === "reversed"
                          ? `${r.reference ?? ""} · ${r.reversalReason ?? ""}`
                          : r.status === "rejected"
                            ? r.rejectionReason
                            : (r.reference ?? "—")}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{cairoTime(r.reversedAt ?? r.reviewedAt ?? r.createdAt)}</TableCell>
                      <TableCell className="text-end">
                        {r.status === "paid" && <ReversePayoutAction payoutId={r.id} amount={egpAmount(r.amount)} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        <Pager page={page} pageSize={history.pageSize} total={history.total} href={(p) => filterHref("/tallaby-pay/payouts", { page: p })} />
      </section>
    </div>
  );
}
