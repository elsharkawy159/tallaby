import Link from "next/link";
import {
  AlertTriangle,
  CircleCheck,
  CircleX,
  Clock,
  Gift,
  Info,
  Wallet,
} from "lucide-react";
import { listManualStoreTopUps } from "@workspace/lib/store-wallet/server";
import { getLocale, getTranslations } from "next-intl/server";
import { getFeeTrialStatus } from "@workspace/lib/sellers";
import { Badge } from "@workspace/ui/components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
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
import { FEE_PER_ORDER_EGP, ordersCovered } from "./store-wallet.lib";
import { TopUpPanel } from "./top-up.client";

/** The runway bar is full at this many orders. */
const RUNWAY_FULL_ORDERS = 200;

/** Below this (EGP) the notice gets stronger (D21 / P6-08). Optional purchases stop at the wallet's limit. */
const NEGATIVE_ALERT_EGP = -500;

const signedClass = (value: number) =>
  value < 0
    ? "text-destructive"
    : value > 0
      ? "text-success"
      : "text-foreground";

/**
 * Store wallet (PLAN.md §13.4, P6-06): signed balance, this month's sales and
 * fees, trial, how the fee works, and every ledger entry. The balance shown
 * is the wallet row; the ledger total beside it must always match.
 */
export async function StoreWalletSection({
  sellerId,
  filter,
  before,
  openTopUp = false,
}: {
  sellerId: string;
  filter: EntryFilter;
  before: string | null;
  openTopUp?: boolean;
}) {
  const [overview, rows, topUps, t, tStatus, locale] = await Promise.all([
    getStoreWalletOverview(sellerId),
    listStoreWalletEntries(sellerId, { filter, before }),
    listManualStoreTopUps(sellerId),
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
  const runway = ordersCovered(balance);
  const entries = rows.slice(0, ENTRIES_PAGE_SIZE);
  const pendingTotal = topUps
    .filter((r) => r.status === "pending")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const next =
    rows.length > ENTRIES_PAGE_SIZE
      ? entryCursor(entries[entries.length - 1]!)
      : null;
  const href = (params: Record<string, string | null>) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
      if (value) search.set(key, value);
    const query = search.toString();
    return query ? `/wallet?${query}` : "/wallet";
  };

  return (
    <section
      id="store-wallet"
      aria-labelledby="store-wallet-title"
      className="mx-auto space-y-5"
    >
      {/* No page title: the header's breadcrumb already names the page. */}
      <p className="text-pretty text-muted-foreground">
        {t("pageDescription", { fee: FEE_PER_ORDER_EGP })}
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-wrap items-center gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-ink">
              <Wallet className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <h2
                id="store-wallet-title"
                className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
              >
                {t("title")}
                {overview.status !== "active" && (
                  <Badge variant="outline">
                    {t(`walletStatus.${overview.status}`)}
                  </Badge>
                )}
              </h2>
              <p
                dir="ltr"
                className={cn(
                  "text-start text-3xl font-bold tabular-nums rtl:text-end",
                  signedClass(balance),
                )}
              >
                {formatMoney(balance, locale)}
              </p>
              {pendingTotal > 0 && (
                <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2.5 py-0.5 text-xs font-medium text-accent-ink">
                  <Clock className="size-3.5" aria-hidden />
                  {t("pendingTopUps", {
                    amount: formatMoney(pendingTotal, locale),
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("thisMonth", {
                  sales: formatMoney(Number(overview.salesThisMonth), locale),
                  fees: formatMoney(Number(overview.feesThisMonth), locale),
                })}
              </p>
            </div>
          </CardContent>
          {balance < 0 && (
            <p className="mx-6 mb-6 flex gap-2 rounded-xl bg-destructive-soft p-3 text-[13px] text-destructive">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {balance <= NEGATIVE_ALERT_EGP
                ? t("negativeStrong")
                : t("negative")}
            </p>
          )}
        </Card>

        <Card>
          <CardContent className="flex h-full flex-col gap-2 text-[13px]">
            <p className="flex items-center gap-2 font-semibold">
              <Info className="size-4 text-primary-ink" aria-hidden />
              {t("howTitle")}
            </p>
            <p className="text-pretty text-muted-foreground">{t("how")}</p>
            {(trial.state === "active" || trial.state === "not_started") && (
              <p className="flex gap-2 rounded-lg bg-success-soft p-2 text-success">
                <Gift className="mt-0.5 size-4 shrink-0" aria-hidden />
                {trial.state === "active"
                  ? t("trialActive", {
                      days: trial.daysLeft,
                      date: formatDate(trial.endsAt, locale),
                    })
                  : t("trialNotStarted")}
              </p>
            )}
            <div className="mt-auto flex items-center gap-2.5 pt-2 text-[12.5px] text-muted-foreground">
              <span className="shrink-0">{t("runway", { count: runway })}</span>
              <span
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-border"
                aria-hidden
              >
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min(100, (runway / RUNWAY_FULL_ORDERS) * 100)}%`,
                  }}
                />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <TopUpPanel
        sellerId={sellerId}
        balance={balance}
        disabled={overview.status !== "active"}
        defaultOpen={openTopUp}
      />

      {topUps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("requests.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {topUps.map((r) => {
                const Icon =
                  r.status === "pending"
                    ? Clock
                    : r.status === "succeeded"
                      ? CircleCheck
                      : CircleX;
                const state =
                  r.status === "pending"
                    ? "pending"
                    : r.status === "succeeded"
                      ? "approved"
                      : "rejected";
                return (
                  <li
                    key={r.id}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-full",
                        state === "pending" && "bg-accent-soft text-accent-ink",
                        state === "approved" && "bg-success-soft text-success",
                        state === "rejected" &&
                          "bg-destructive-soft text-destructive",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {t(`requests.${state}`)} ·{" "}
                        {t(`requests.methods.${r.method}`)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(r.createdAt, locale)}
                        {state === "rejected" && r.failureReason && (
                          <> · {r.failureReason}</>
                        )}
                      </p>
                    </div>
                    <p dir="ltr" className="font-semibold tabular-nums">
                      {formatMoney(Number(r.amount), locale)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

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
                  filter === key
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground",
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
                <TableHead className="max-sm:hidden">
                  {t("columns.store")}
                </TableHead>
                <TableHead className="max-sm:hidden">
                  {t("columns.order")}
                </TableHead>
                <TableHead className="text-end">
                  {t("columns.amount")}
                </TableHead>
                <TableHead className="text-end">
                  {t("columns.balance")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    {t("empty")}
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const amount = Number(entry.amount);
                  return (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(entry.createdAt, locale)}
                      </TableCell>
                      <TableCell>
                        <span className="block">
                          {translateStatus(tStatus, "transaction", entry.type)}
                        </span>
                        {entry.description && (
                          <span className="block text-xs text-muted-foreground">
                            {entry.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-sm:hidden">
                        {entry.storeName ?? t("accountLevel")}
                      </TableCell>
                      <TableCell className="max-sm:hidden">
                        {entry.orderId && entry.orderNumber ? (
                          <Link
                            href={`/orders?order=${entry.orderId}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {entry.orderNumber}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      {/* bdi keeps the number's own direction while the cell aligns with its RTL/LTR header. */}
                      <TableCell
                        className={cn(
                          "text-end font-semibold tabular-nums",
                          signedClass(amount),
                        )}
                      >
                        <bdi dir="ltr">
                          {amount > 0 ? "+" : ""}
                          {formatMoney(amount, locale)}
                        </bdi>
                      </TableCell>
                      <TableCell className="text-end tabular-nums text-muted-foreground">
                        {entry.balanceAfter == null ? (
                          "—"
                        ) : (
                          <bdi dir="ltr">
                            {formatMoney(Number(entry.balanceAfter), locale)}
                          </bdi>
                        )}
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
                href={href({
                  entries: filter === "all" ? null : filter,
                  before: next,
                })}
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
