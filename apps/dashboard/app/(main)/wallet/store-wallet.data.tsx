import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronDown,
  CircleCheck,
  CircleX,
  Clock,
  Gift,
  Info,
  Plus,
  ReceiptText,
  Wallet,
} from "lucide-react";
import { getWelcomeGiftStatus, listManualStoreTopUps } from "@workspace/lib/store-wallet/server";
import { getLocale, getTranslations } from "next-intl/server";
import { quoteTopUp } from "@workspace/lib/billing";
import { getFeeTrialStatus } from "@workspace/lib/sellers";
import { cn } from "@workspace/ui/lib/utils";
import { getBillingState } from "@workspace/lib/billing/server";
import { EmptyState, IconTile, Note, Row, Rows, SellerButton, SellerCard, SellerCardHeader } from "@/components/seller-ui";
import { loadOrderLock } from "@/lib/auth/require-seller.server";
import { formatDate } from "@/lib/i18n/format";
import { translateStatus } from "@/lib/i18n/status";
import {
  ENTRIES_PAGE_SIZE,
  ENTRY_FILTERS,
  entryCursor,
  getStoreWalletOverview,
  listStoreWalletEntries,
  type EntryFilter,
} from "./store-wallet.server";
import { FEE_PER_ORDER_EGP, FEE_PER_ORDER_USD, orderCountValues, ordersCovered, walletMoney } from "./store-wallet.lib";
import { TopUpPanel } from "./top-up.client";

/** The runway bar is full at this many orders. */
const RUNWAY_FULL_ORDERS = 200;

/** Below this (EGP) the notice gets stronger (D21 / P6-08). Optional purchases stop at the wallet's limit. */
const NEGATIVE_ALERT_EGP = -500;
const NEGATIVE_ALERT_USD = -10;

/**
 * Store wallet (PLAN.md §13.4, P6-06): signed balance, trial, how the fee works,
 * top-up and every ledger entry. The balance shown is the wallet row; the ledger
 * total beside it must always match.
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
  const { locked } = await loadOrderLock(sellerId);
  const [overview, rows, topUps, gift, t, tStatus, locale, billing] = await Promise.all([
    getStoreWalletOverview(sellerId),
    listStoreWalletEntries(sellerId, { filter, before, hideSales: locked }),
    listManualStoreTopUps(sellerId),
    // The welcome gift (0119); a missing table before the migration shows nothing.
    getWelcomeGiftStatus(sellerId).catch(() => null),
    getTranslations("storeWallet"),
    getTranslations("status"),
    getLocale(),
    getBillingState(),
  ]);
  if (!overview) return null;
  const usd = overview.currency === "USD";
  const money = (value: string | number) => walletMoney(value, overview.currency, locale);

  const balance = Number(overview.balance);
  const trial = getFeeTrialStatus({
    feeTrialEligible: overview.trial.eligible,
    feeTrialStartedAt: overview.trial.startedAt,
    feeTrialEndsAt: overview.trial.endsAt,
  });
  const runway = ordersCovered(balance, overview.currency);
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
  // Only a rough figure for a positive USD balance: what it would cost at today's rate.
  const balanceQuote = usd && balance > 0 ? quoteTopUp(Math.round(balance * 100), billing) : null;

  return (
    <>
      <section
        id="store-wallet"
        aria-labelledby="store-wallet-title"
        className="sui-rise relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 overflow-hidden rounded-[28px] bg-(--s-setup) px-7 py-[26px] text-white before:pointer-events-none before:absolute before:inset-x-[40%_-10%] before:-top-[70%] before:h-[170%] before:bg-[radial-gradient(50%_50%_at_50%_40%,rgb(253_173_40/0.22),transparent_70%)] max-[900px]:grid-cols-1 max-[720px]:rounded-[24px] max-[720px]:px-[18px] max-[720px]:py-[22px]"
      >
        <div className="relative flex min-w-0 flex-col gap-1.5">
          <h1 id="store-wallet-title" className="flex flex-wrap items-center gap-1.5 text-[13px] font-normal text-white/70">
            <Wallet className="size-[15px]" aria-hidden />
            {t("title")}
            {overview.status !== "active" && (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white">
                {t(`walletStatus.${overview.status}`)}
              </span>
            )}
          </h1>
          <p className="flex flex-wrap items-baseline gap-3">
            <bdi
              className={cn(
                "font-montserrat text-[clamp(40px,5vw,56px)] font-extrabold leading-[1.1] tracking-[-.02em] tabular-nums",
                balance < 0 && "text-[#fca5a5]",
              )}
            >
              {money(balance)}
            </bdi>
            {balanceQuote && (
              <span className="text-sm text-white/70">
                ≈ <bdi className="tabular-nums">{walletMoney(balanceQuote.basePiastres / 100, "EGP", locale)}</bdi>
              </span>
            )}
          </p>
          {pendingTotal > 0 && (
            <p className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
              <Clock className="size-3.5 text-accent" aria-hidden />
              {t("pendingTopUps", {
                amount: walletMoney(pendingTotal, "EGP", locale),
              })}
            </p>
          )}
          <div className="mt-2.5 flex max-w-[520px] flex-col gap-2">
            <div className="flex flex-wrap justify-between gap-x-4 text-[13px] text-white/75">
              <span>{t("runway", orderCountValues(runway, locale))}</span>
              <span>
                {t("orderFee")}{" "}
                <bdi className="font-montserrat font-bold text-white">{money(usd ? FEE_PER_ORDER_USD : FEE_PER_ORDER_EGP)}</bdi>
              </span>
            </div>
            <span className="h-2 overflow-hidden rounded-full bg-white/12" aria-hidden>
              <span
                className="block h-full rounded-full bg-accent transition-[width] duration-500"
                style={{ width: `${Math.min(100, (runway / RUNWAY_FULL_ORDERS) * 100)}%` }}
              />
            </span>
          </div>
        </div>
        <div className="relative flex min-w-[240px] flex-col max-[900px]:min-w-0">
          <SellerButton asChild className="h-[50px] text-[15px]">
            <a href="#topup">
              <Plus aria-hidden />
              {t("manualTopUp.button")}
            </a>
          </SellerButton>
        </div>
      </section>

      {balance < 0 && (
        <Note tone="danger" icon={AlertTriangle} className="text-[13px]">
          {balance <= (usd ? NEGATIVE_ALERT_USD : NEGATIVE_ALERT_EGP) ? t("negativeStrong") : t("negative")}
        </Note>
      )}

      <TopUpPanel
        billing={usd ? billing : null}
        sellerId={sellerId}
        balance={balance}
        disabled={overview.status !== "active"}
        defaultOpen={openTopUp}
        below={
          <>
            {topUps.length > 0 && (
              <SellerCard aria-labelledby="top-up-requests-title">
                <SellerCardHeader id="top-up-requests-title" title={t("requests.title")} />
                <div className="p-4 pt-3.5">
                  <Rows>
                    {topUps.map((r) => {
                      const state =
                        r.status === "pending" ? "pending" : r.status === "succeeded" ? "approved" : "rejected";
                      return (
                        <Row
                          key={r.id}
                          start={
                            <IconTile
                              icon={state === "pending" ? Clock : state === "approved" ? CircleCheck : CircleX}
                              tone={state === "pending" ? "accent" : state === "approved" ? "success" : "danger"}
                            />
                          }
                          title={`${t(`requests.${state}`)} · ${t(`requests.methods.${r.method}`)}`}
                          description={
                            <>
                              {formatDate(r.createdAt, locale)}
                              {state === "rejected" && r.failureReason && <> · {r.failureReason}</>}
                            </>
                          }
                          end={
                            <bdi className="font-montserrat text-sm font-bold text-(--s-ink) tabular-nums">
                              {walletMoney(Number(r.amount), "EGP", locale)}
                            </bdi>
                          }
                        />
                      );
                    })}
                  </Rows>
                </div>
              </SellerCard>
            )}

            <SellerCard aria-labelledby="wallet-entries-title">
              <SellerCardHeader
                id="wallet-entries-title"
                title={t("entriesTitle")}
                description={t("entriesDescription")}
                className="flex-wrap items-center"
                action={
                  <nav aria-label={t("filterLabel")} className="flex flex-wrap gap-1.5">
                    {ENTRY_FILTERS.filter((key) => !locked || key !== "sales").map((key) => (
                      <Link
                        key={key}
                        href={href({ entries: key === "all" ? null : key })}
                        aria-current={filter === key ? "page" : undefined}
                        className="inline-flex h-[34px] items-center whitespace-nowrap rounded-full border border-(--s-field) bg-(--s-surface) px-3.5 text-[12.5px] font-semibold text-(--s-muted) no-underline transition-colors duration-150 hover:border-(--tallaby-teal-300) aria-[current=page]:border-(--s-solid) aria-[current=page]:bg-(--s-solid) aria-[current=page]:text-(--s-solid-fg) max-[600px]:h-10"
                      >
                        {t(`filters.${key}`)}
                      </Link>
                    ))}
                  </nav>
                }
              />
              {entries.length === 0 ? (
                <EmptyState icon={ReceiptText} title={t("empty")} />
              ) : (
                <ul className="flex flex-col px-3 pb-3.5 pt-2.5">
                  {entries.map((entry) => {
                    const amount = Number(entry.amount);
                    const incoming = amount > 0;
                    return (
                      <li
                        key={entry.id}
                        className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-2xl px-2.5 py-3 transition-colors duration-150 hover:bg-(--s-tint) [&+&]:border-t [&+&]:border-(--s-line-soft) max-[720px]:gap-2.5"
                      >
                        <IconTile
                          icon={incoming ? ArrowDownLeft : ArrowUpRight}
                          tone={incoming ? "success" : "danger"}
                          className="size-10 rounded-[13px] max-[720px]:size-9"
                        />
                        <div className="min-w-0">
                          <b className="block text-[13.5px] font-bold text-(--s-text)">
                            {translateStatus(tStatus, "transaction", entry.type)}
                          </b>
                          {entry.description && (
                            <small className="block text-xs text-(--s-subtle)">{entry.description}</small>
                          )}
                          <small className="block text-xs text-(--s-subtle)">
                            {entry.storeName ?? t("accountLevel")}
                            {entry.orderId && entry.orderNumber && (
                              <>
                                {" · "}
                                <Link href={`/orders?order=${entry.orderId}`} className="text-(--s-link) underline-offset-2 hover:underline">
                                  {entry.orderNumber}
                                </Link>
                              </>
                            )}
                            {" · "}
                            {formatDate(entry.createdAt, locale)}
                          </small>
                        </div>
                        <div className="text-end">
                          {/* bdi keeps the number's own direction while the cell aligns with the row. */}
                          <bdi
                            className={cn(
                              "block font-montserrat text-sm font-bold tabular-nums",
                              amount < 0 ? "text-destructive" : amount > 0 ? "text-success" : "text-(--s-ink)",
                            )}
                          >
                            {amount > 0 ? "+" : ""}
                            {walletMoney(amount, entry.currency, locale)}
                          </bdi>
                          {entry.balanceAfter != null && (
                            <small className="block text-xs text-(--s-subtle)">
                              {t("columns.balance")}{" "}
                              <bdi className="font-montserrat tabular-nums">
                                {walletMoney(Number(entry.balanceAfter), entry.currency, locale)}
                              </bdi>
                            </small>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
              {next && (
                <div className="flex justify-center pb-[18px]">
                  <SellerButton asChild variant="mini" size="xs">
                    <Link
                      href={href({
                        entries: filter === "all" ? null : filter,
                        before: next,
                      })}
                    >
                      {t("older")}
                    </Link>
                  </SellerButton>
                </div>
              )}
            </SellerCard>
          </>
        }
        side={
          <>
            {(trial.state === "active" || trial.state === "not_started") && (
              <Note tone="success" icon={Gift}>
                {trial.state === "active"
                  ? t("trialActive", {
                      days: trial.daysLeft,
                      date: formatDate(trial.endsAt, locale),
                    })
                  : t("trialNotStarted")}
              </Note>
            )}
            {gift && !gift.expired && Number(gift.remaining) > 0 && (
              <Note tone="success" icon={Gift}>
                {t("welcomeGiftActive", {
                  amount: money(Number(gift.remaining)),
                  date: formatDate(gift.expiresAt, locale),
                })}
              </Note>
            )}
            <details className="group min-w-0 rounded-[24px] border border-(--s-line) bg-(--s-glass) px-5 py-[18px] shadow-(--s-shadow-card) max-[600px]:rounded-[20px]">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-bold text-(--s-ink) [&::-webkit-details-marker]:hidden">
                <Info className="size-[17px] shrink-0 text-(--s-primary)" aria-hidden />
                {t("howTitle")}
                <ChevronDown
                  className="ms-auto size-[17px] shrink-0 text-(--s-primary) transition-transform duration-[250ms] group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <p className="mt-2.5 text-pretty text-[12.5px] leading-[1.8] text-(--s-muted)">
                {usd ? t("howUsd", { fee: money(FEE_PER_ORDER_USD) }) : t("how")}
              </p>
              {usd && (
                <ul className="mt-2.5 flex flex-col gap-1.5 text-[12.5px] text-(--s-muted)">
                  <li className="flex justify-between gap-3 rounded-xl bg-(--s-tint) px-3 py-2">
                    <span>{t("howFree")}</span>
                    <b className="text-(--s-ink)">
                      <bdi className="font-montserrat">{money(FEE_PER_ORDER_USD)}</bdi> / {t("howPerOrder")}
                    </b>
                  </li>
                  <li className="flex justify-between gap-3 rounded-xl bg-(--s-tint) px-3 py-2">
                    <span>{t("howPro")}</span>
                    <b className="text-(--s-ink)">{t("howProValue")}</b>
                  </li>
                </ul>
              )}
            </details>
          </>
        }
      />
    </>
  );
}
