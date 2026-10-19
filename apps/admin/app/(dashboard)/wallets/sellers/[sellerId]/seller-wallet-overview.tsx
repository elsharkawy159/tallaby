import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, TriangleAlert } from "lucide-react";
import { decimalToPiastres } from "@workspace/lib/admin";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { TRIAL_STATE_LABELS } from "../../../sellers/[id]/seller-admin.lib";
import { AdjustStoreWalletButton, NegativeLimitButton } from "../../store-wallet-actions.client";
import type { SellerWalletHeader } from "../../store-wallets.data";
import { WALLET_STATUS_LABELS, cairoDateTime, egp, entryTypeLabel, signClass } from "../../store-wallets.lib";

/** Exact comparison of two numeric strings (piastres, no floats). */
const sameMoney = (a: string | null | undefined, b: string | null | undefined) =>
  decimalToPiastres(a ?? "0") === decimalToPiastres(b ?? "0");

function Check({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {ok ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-700" aria-hidden />
      ) : (
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden />
      )}
      <div>
        <div className={ok ? "" : "font-medium text-red-600"}>{label}</div>
        <div className="text-xs text-muted-foreground">{detail}</div>
      </div>
    </div>
  );
}

export function SellerWalletOverview({ sellerId, header }: { sellerId: string; header: SellerWalletHeader }) {
  const { account, breakdown } = header;
  const wallet = account.wallet;
  const balance = wallet?.balance ?? "0";
  const ledgerOk = sameMoney(balance, wallet?.ledgerTotal ?? "0");
  const mirrorOk = !wallet || sameMoney(balance, breakdown.seller?.mirrorBalance ?? "0");
  const limit = wallet?.negativeLimit ?? null;
  const name = breakdown.seller?.name ?? sellerId;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link href="/wallets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> All seller wallets
          </Link>
          <h1 className="text-2xl font-semibold">{name}</h1>
          <p className="text-sm text-muted-foreground">
            {breakdown.seller?.email ?? "—"} · seller {breakdown.seller?.status ?? "—"} ·{" "}
            <Link href={`/sellers/${sellerId}`} className="inline-flex items-center gap-1 hover:underline">
              Seller profile <ExternalLink className="size-3" aria-hidden />
            </Link>
          </p>
        </div>
        <AdjustStoreWalletButton sellerId={sellerId} stores={breakdown.stores} size="default" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Store wallet balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`text-4xl font-semibold tabular-nums ${signClass(balance)}`}>{egp(balance)}</div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant={!wallet || wallet.status === "active" ? "outline" : "destructive"}>
                {wallet ? (WALLET_STATUS_LABELS[wallet.status] ?? wallet.status) : "Not opened yet"}
              </Badge>
              {Number(balance) < 0 && <span className="text-red-600">The seller owes Tallaby {egp(balance.replace(/^-/, ""))}</span>}
            </div>
            {!wallet && (
              <p className="text-xs text-muted-foreground">The wallet row is created with the first entry or adjustment.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Check
              ok={ledgerOk}
              label={ledgerOk ? "Balance matches the ledger" : "Balance does not match the ledger. Investigate before changing anything."}
              detail={`Sum of all entries: ${egp(wallet?.ledgerTotal ?? "0")}`}
            />
            <Check
              ok={mirrorOk}
              label={mirrorOk ? "Seller balance mirror is in sync" : "sellers.wallet_balance is out of sync"}
              detail={`Mirror: ${egp(breakdown.seller?.mirrorBalance ?? "0")}`}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Limits and fees</CardTitle>
            <NegativeLimitButton sellerId={sellerId} current={limit} />
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              Negative limit: <strong>{limit ? `${egp(limit)} below zero` : "None (no overdraft)"}</strong>
              <div className="text-xs text-muted-foreground">For ads and themes only. Platform fees always post.</div>
            </div>
            <div>
              Fee plan: <strong>{account.feePlan}</strong>
              {account.isCommissionExempt && <Badge className="ms-2" variant="secondary">Exempt</Badge>}
            </div>
            <div>
              Free trial: <strong>{TRIAL_STATE_LABELS[account.trial.state] ?? account.trial.state}</strong>
              {account.trial.endsAt && (
                <span className="text-muted-foreground">
                  {" "}
                  · {account.trial.state === "active" ? "ends" : "ended"} {cairoDateTime(account.trial.endsAt)}
                </span>
              )}
            </div>
            <Link href={`/sellers/${sellerId}#wallet`} className="text-xs text-muted-foreground hover:underline">
              Change fee plan, trial or exemption on the seller page
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Totals by type (all time)</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.byType.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entries yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {breakdown.byType.map((row) => (
                    <tr key={row.type} className="border-b last:border-b-0">
                      <td className="py-2">{entryTypeLabel(row.type)}</td>
                      <td className="py-2 text-right text-muted-foreground">{row.count.toLocaleString()} entries</td>
                      <td className={`py-2 text-right font-medium tabular-nums ${signClass(row.total)}`}>{egp(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Totals by store (all time)</CardTitle>
          </CardHeader>
          <CardContent>
            {breakdown.byStore.length === 0 ? (
              <p className="text-sm text-muted-foreground">No entries yet.</p>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {breakdown.byStore.map((row) => (
                    <tr key={row.storeId ?? "account"} className="border-b last:border-b-0">
                      <td className="py-2">{row.storeName ?? "Account level"}</td>
                      <td className="py-2 text-right text-muted-foreground">{row.count.toLocaleString()} entries</td>
                      <td className={`py-2 text-right font-medium tabular-nums ${signClass(row.total)}`}>{egp(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
