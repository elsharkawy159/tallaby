import { TriangleAlert } from "lucide-react";
import { PRO_MONTHLY_USD_CENTS, topUpRate } from "@workspace/lib/billing";
import { RATE_STALE_HOURS, isRateStale, rateAgeHours } from "@workspace/lib/admin";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { cairoDateTime, egp, walletMoney } from "../wallets/store-wallets.lib";
import { BillingSettingsForm } from "./billing.client";
import { getBillingPageData } from "./billing.data";

export const dynamic = "force-dynamic";

const rateText = (rate: number | null) => (rate === null ? "—" : `$1 = ${rate.toFixed(4)} EGP`);

function Fact({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold tabular-nums">{children}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** The USD switch, exchange rates, margin and tax, and Pro income (ROADMAP.md F-55f, F-56). */
export default async function BillingPage() {
  const data = await getBillingPageData();
  if (!data) return <p className="text-sm text-muted-foreground">Billing could not be loaded. Try again.</p>;

  const { state, usdLiveAt, conversionRate, rateOverride, rates, pro, dryRun } = data;
  const fetchedRate = rates[0] ? Number(rates[0].marketRate) : null;
  const age = rateAgeHours(state.rateFetchedAt);
  const stale = isRateStale(state.rateFetchedAt);
  const proIncome = (pro.paid * PRO_MONTHLY_USD_CENTS) / 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">The USD store wallet: exchange rates, margin, tax and Pro income.</p>
      </div>

      {stale && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            {age === null
              ? "No market rate has been fetched yet. Check the daily exchange-rate job."
              : `The last market rate is ${age} hours old (over ${RATE_STALE_HOURS}). Check the daily exchange-rate job, or set a fixed rate below.`}
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">USD switch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant={state.usdLive ? "default" : "outline"}>{state.usdLive ? "USD is live" : "Not live: EGP wallets"}</Badge>
              {usdLiveAt && <p className="mt-1 text-xs text-muted-foreground">Since {cairoDateTime(usdLiveAt)}</p>}
            </div>
            <Fact label="Conversion rate" hint={state.usdLive ? "What the wallets were converted at, with no margin." : "Set on switch day."}>
              {rateText(conversionRate)}
            </Fact>
            <p className="text-xs text-muted-foreground">
              There is no switch button here. The switch runs once, by SQL, with the owner's approval, and can't be undone from this page.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rates now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Fact
              label={rateOverride !== null ? "Market rate (fixed by Admin)" : "Market rate"}
              hint={
                rateOverride !== null
                  ? `Latest fetch: ${rateText(fetchedRate)}, ${age === null ? "none yet" : `${age} hours ago`}`
                  : age === null
                    ? "Not fetched yet"
                    : `Fetched ${age} hours ago`
              }
            >
              {rateText(state.marketRate)}
            </Fact>
            <Fact label={`Top-up rate (${state.marginBps / 100}% margin)`} hint={state.taxEnabled ? `Plus ${state.taxRateBps / 100}% tax on the EGP paid` : "No tax"}>
              {rateText(state.marketRate ? topUpRate(state.marketRate, state.marginBps) : null)}
            </Fact>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pro plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Fact label="Monthly Pro income" hint={`${pro.paid.toLocaleString("en-US")} paid × ${walletMoney(PRO_MONTHLY_USD_CENTS / 100, "USD")}`}>
              {walletMoney(proIncome, "USD")}
            </Fact>
            <div className="grid grid-cols-2 gap-4">
              <Fact label="Paid Pro" hint={pro.inGrace > 0 ? `${pro.inGrace.toLocaleString("en-US")} more in grace, not counted` : undefined}>
                {pro.paid.toLocaleString("en-US")}
              </Fact>
              <Fact label="Pro from Admin" hint="Free, not income">
                {pro.adminGranted.toLocaleString("en-US")}
              </Fact>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <BillingSettingsForm
              marginPercent={state.marginBps / 100}
              rateOverride={rateOverride}
              taxEnabled={state.taxEnabled}
              taxRatePercent={state.taxRateBps / 100}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Last {rates.length || 10} market rates</CardTitle>
          </CardHeader>
          <CardContent>
            {rates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No rates fetched yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {rates.map((rate) => (
                    <tr key={rate.id} className="border-b last:border-b-0">
                      <td className="py-2 whitespace-nowrap">{cairoDateTime(rate.fetchedAt)}</td>
                      <td className="py-2 text-muted-foreground">{rate.source}</td>
                      <td className="py-2 text-right font-medium tabular-nums">{Number(rate.marketRate).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {!state.usdLive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">What the switch would do today</CardTitle>
          </CardHeader>
          <CardContent>
            {!dryRun ? (
              <p className="text-sm text-muted-foreground">Shown once there is a market rate.</p>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Read-only, at {rateText(dryRun.rate)} with no margin. Nothing changes until the switch runs, and the rate on the day decides the real numbers.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Fact label="Wallets to convert" hint={`${dryRun.positiveWallets.toLocaleString("en-US")} above zero, ${dryRun.negativeWallets.toLocaleString("en-US")} below`}>
                    {dryRun.wallets.toLocaleString("en-US")}
                  </Fact>
                  <Fact label="Held for sellers" hint={`From ${egp(dryRun.positiveEgp)}`}>
                    {walletMoney(dryRun.positiveUsd, "USD")}
                  </Fact>
                  <Fact label="Owed by sellers" hint={`From ${egp(dryRun.negativeEgp)}`}>
                    {walletMoney(dryRun.negativeUsd, "USD")}
                  </Fact>
                  <Fact label="Held balance from old sales" hint="For information: old order money inside positive balances">
                    {egp(dryRun.positiveEgpFromOldSales)}
                  </Fact>
                  <Fact label="Pending top-ups" hint="Credited at this rate, with no margin">
                    {dryRun.pendingTopUps.toLocaleString("en-US")}
                  </Fact>
                  <Fact label="Welcome gifts ending" hint="Sellers who haven't finished setup">
                    {dryRun.giftsEnding.toLocaleString("en-US")}
                  </Fact>
                  <Fact label="Unstarted trials ending">{dryRun.unstartedTrialsEnding.toLocaleString("en-US")}</Fact>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
