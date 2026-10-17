import Link from "next/link";
import { AlertTriangle, Gift, Info, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { getFeeTrialStatus } from "@workspace/lib/sellers";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { cn } from "@workspace/ui/lib/utils";
import { formatDate, formatMoney } from "@/lib/i18n/format";
import { translateStatus } from "@/lib/i18n/status";
import {
  ENTRIES_PAGE_SIZE,
  ENTRY_FILTERS,
  entryCursor,
  getStoreWalletOverview,
  listStoreWalletEntries,
  type EntryFilter,
} from "./store-wallet.server";
import { TopUpButton } from "./top-up.client";

const signedClass = (value: number) =>
  value < 0 ? "text-destructive" : value > 0 ? "text-success" : "text-foreground";

/**
 * Store wallet (PLAN.md §13.4, P6-06): signed balance, this month's sales and
 * fees, trial, how the fee works, and every ledger entry. The balance shown
 * is the wallet row; the ledger total beside it must always match.
 */
export async function StoreWalletSection({
  sellerId,
  filter,
  before,
}: {
  sellerId: string;
  filter: EntryFilter;
  before: string | null;
}) {
  const [overview, rows, t, tStatus, locale] = await Promise.all([
    getStoreWalletOverview(sellerId),
    listStoreWalletEntries(sellerId, { filter, before }),
    getTranslations("storeWallet"),
    getTranslations("status"),
    getLocale(),
  ]);
  if (!overview) return null;

  const balance = Number(overview.balance);
  const trial = getFeeTrialStatus({
    feeTrialEligible: overview.trial.eligible,
    feeTrialStartedAt: overview.trial.startedAt,
    feeTrialEndsAt: overview.trial.endsAt,
  });
  const entries = rows.slice(0, ENTRIES_PAGE_SIZE);
  const next = rows.length > ENTRIES_PAGE_SIZE ? entryCursor(entries[entries.length - 1]!) : null;
  const href = (params: Record<string, string | null>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    const query = search.toString();
    return query ? `/financial?${query}#store-wallet` : "/financial#store-wallet";
  };

  return (
    <section id="store-wallet" aria-labelledby="store-wallet-title" className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-wrap items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
              <Wallet className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="store-wallet-title" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {t("title")}
                {overview.status !== "active" && <Badge variant="outline">{t(`walletStatus.${overview.status}`)}</Badge>}
              </h2>
              <p dir="ltr" className={cn("text-start text-3xl font-bold tabular-nums rtl:text-end", signedClass(balance))}>
                {formatMoney(balance, locale)}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("thisMonth", {
                  sales: formatMoney(Number(overview.salesThisMonth), locale),
                  fees: formatMoney(Number(overview.feesThisMonth), locale),
                })}
              </p>
            </div>
            <TopUpButton disabled={overview.status !== "active"} />
          </CardContent>
          {balance < 0 && (
            <p className="mx-6 mb-6 flex gap-2 rounded-xl bg-destructive-soft p-3 text-[13px] text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {t("negative")}
            </p>
          )}
        </Card>

        <Card>
          <CardContent className="space-y-2 text-[13px]">
            <p className="flex items-center gap-2 font-semibold">
              <Info className="size-4 text-primary-ink" aria-hidden />
              {t("howTitle")}
            </p>
            <p className="text-pretty text-muted-foreground">{t("how")}</p>
            {(trial.state === "active" || trial.state === "not_started") && (
              <p className="flex gap-2 rounded-lg bg-success-soft p-2 text-success">
                <Gift className="mt-0.5 size-4 shrink-0" aria-hidden />
                {trial.state === "active"
                  ? t("trialActive", { days: trial.daysLeft, date: formatDate(trial.endsAt, locale) })
                  : t("trialNotStarted")}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle>{t("entriesTitle")}</CardTitle>
          <nav aria-label={t("filterLabel")} className="flex flex-wrap gap-1.5">
            {ENTRY_FILTERS.map((key) => (
              <Link
                key={key}
                href={href({ entries: key === "all" ? null : key })}
                aria-current={filter === key ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  filter === key ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {t(`filters.${key}`)}
              </Link>
            ))}
          </nav>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columns.date")}</TableHead>
                <TableHead>{t("columns.type")}</TableHead>
                <TableHead>{t("columns.store")}</TableHead>
                <TableHead>{t("columns.order")}</TableHead>
                <TableHead className="text-end">{t("columns.amount")}</TableHead>
                <TableHead className="text-end">{t("columns.balance")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const amount = Number(entry.amount);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(entry.createdAt, locale)}</TableCell>
                      <TableCell>
                        <span className="block">{translateStatus(tStatus, "transaction", entry.type)}</span>
                        {entry.description && <span className="block text-xs text-muted-foreground">{entry.description}</span>}
                      </TableCell>
                      <TableCell>{entry.storeName ?? t("accountLevel")}</TableCell>
                      <TableCell>
                        {entry.orderId && entry.orderNumber ? (
                          <Link href={`/orders/${entry.orderId}`} className="underline-offset-2 hover:underline">
                            {entry.orderNumber}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell dir="ltr" className={cn("text-end font-semibold tabular-nums", signedClass(amount))}>
                        {amount > 0 ? "+" : ""}
                        {formatMoney(amount, locale)}
                      </TableCell>
                      <TableCell dir="ltr" className="text-end tabular-nums text-muted-foreground">
                        {entry.balanceAfter == null ? "—" : formatMoney(Number(entry.balanceAfter), locale)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {next && (
            <div className="mt-4 text-center">
              <Link
                href={href({ entries: filter === "all" ? null : filter, before: next })}
                className="text-sm font-medium text-primary-ink underline-offset-2 hover:underline"
              >
                {t("older")}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
