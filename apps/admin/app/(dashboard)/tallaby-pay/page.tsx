import Link from "next/link";
import type { ReactNode } from "react";
import { parseDateRange } from "@workspace/lib/tallaby-pay";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { loadTallabyPayOverview } from "./tallaby-pay.data";
import { egpAmount, isNegativeAmount } from "./tallaby-pay.lib";
import { FilterForm, LoadError } from "./tallaby-pay.ui";

export const dynamic = "force-dynamic";

function Figure({ label, value, note, negative }: { label: string; value: string; note?: ReactNode; negative?: boolean }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={cn("text-xl font-semibold tabular-nums", negative && "text-destructive")}>{value}</dd>
      {note && <dd className="text-xs text-muted-foreground">{note}</dd>}
    </div>
  );
}

/** Totals: what customers paid, Tallaby's fees, what Tallaby owes the stores and what it paid out. */
export default async function TallabyPayOverviewPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  const range = parseDateRange(await searchParams);
  const result = await loadTallabyPayOverview(range);
  if (!result.data) return <LoadError error={result.error} />;
  const o = result.data;
  const period = range.from || range.to ? `${range.from ?? "start"} to ${range.to ?? "today"}` : "All time";

  return (
    <div className="space-y-5">
      <FilterForm action="/tallaby-pay" from={range.from} to={range.to} />

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        {/* The Fees box (design §8): Tallaby's income from Tallaby Pay. */}
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fees box</CardTitle>
            <p className="text-sm text-muted-foreground">Tallaby&apos;s fee on sales that were not refunded. {period}.</p>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold tabular-nums tracking-tight">{egpAmount(o.fees)}</p>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <Figure label="This month (Cairo)" value={egpAmount(o.feesThisMonth)} />
              <Figure label="All time" value={egpAmount(o.feesAllTime)} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Owed to sellers now</CardTitle>
            <p className="text-sm text-muted-foreground">Across every store, whatever the dates above.</p>
          </CardHeader>
          <CardContent>
            <p className={cn("text-4xl font-bold tabular-nums tracking-tight", isNegativeAmount(o.owed.total) && "text-destructive")}>
              {egpAmount(o.owed.total)}
            </p>
            <dl className="mt-4 grid grid-cols-3 gap-4">
              <Figure label="Pending" value={egpAmount(o.owed.pending)} note="Waiting for delivery" />
              <Figure label="Available" value={egpAmount(o.owed.available)} negative={isNegativeAmount(o.owed.available)} />
              <Figure label="Reserved" value={egpAmount(o.owed.reserved)} note="In open withdrawals" />
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Money in and out</CardTitle>
          <p className="text-sm text-muted-foreground">{period}.</p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Figure label="Collected from customers" value={egpAmount(o.gross)} note={`${o.sales} payments`} />
            <Figure label="Refunded to customers" value={egpAmount(o.refunded)} note={`${o.refundedCount} refunds`} />
            <Figure label="Paid out to sellers" value={egpAmount(o.paidOut)} note={`${o.paidOutCount} withdrawals`} />
            <Figure
              label="Store wallets"
              value={String(o.wallets)}
              note={
                <>
                  <Link href="/tallaby-pay/wallets?filter=negative" className="hover:underline">
                    {o.negativeWallets} negative
                  </Link>
                  {" · "}
                  <Link href="/tallaby-pay/wallets?filter=frozen" className="hover:underline">
                    {o.frozenWallets} frozen
                  </Link>
                </>
              }
            />
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
