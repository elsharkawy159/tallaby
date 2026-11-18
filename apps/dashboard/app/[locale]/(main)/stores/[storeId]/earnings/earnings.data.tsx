import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { AlertTriangle, ArrowUpRight, Banknote, CircleCheck, CircleX, Clock, Hourglass, Info, ReceiptText, Snowflake, Undo2 } from "lucide-react";

import {
  getTallabyPayWalletSummary,
  listTallabyPayPayouts,
  listTallabyPaySales,
  storeHasTallabyPay,
  type TallabyPayPayoutView,
  type TallabyPaySaleView,
} from "@workspace/lib/tallaby-pay/server";
import { Link } from "@/i18n/navigation";
import {
  EmptyState,
  IconTile,
  Note,
  ResponsiveTable,
  Row,
  Rows,
  SellerButton,
  SellerCard,
  SellerCardHeader,
  StatItem,
  StatStrip,
  Tag,
  type Column,
} from "@/components/seller-ui";
import { loadOrderLock } from "@/lib/auth/require-seller.server";
import { formatDate, formatMoney, moneyDir } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { isNegativeAmount, SALE_STATE_TONE, saleState } from "./earnings.lib";
import { KycCard } from "./kyc.client";
import { WithdrawCard } from "./withdraw.client";

const EGP = { currency: "EGP" } as const;
const PAYOUT_HISTORY_SIZE = 20;

const PAYOUT_TONE = {
  requested: "warning",
  paid: "success",
  rejected: "danger",
  cancelled: "muted",
  reversed: "danger",
} as const satisfies Record<TallabyPayPayoutView["status"], string>;

const PAYOUT_ICON = { requested: Clock, paid: CircleCheck, rejected: CircleX, cancelled: CircleX, reversed: Undo2 } as const;

/**
 * Store › Tallaby Pay earnings (ROADMAP.md F-100f; design §8, owner answers
 * §14): balances, sales, the withdraw form, the open request, the withdrawal
 * history and KYC. Everything is read per request and never cached (rule 8);
 * every read is checked against the session seller in the lib (rule 5).
 */
export async function EarningsSection({
  sellerId,
  storeId,
  storeName,
  readOnly,
  page,
}: {
  sellerId: string;
  storeId: string;
  storeName: string;
  readOnly: boolean;
  page: number;
}) {
  const [summary, sales, payouts, enabled, { ordersLocked }, t, locale] = await Promise.all([
    getTallabyPayWalletSummary(sellerId, storeId),
    listTallabyPaySales({ sellerId, storeId, page }),
    listTallabyPayPayouts({ sellerId, storeId, pageSize: PAYOUT_HISTORY_SIZE }),
    storeHasTallabyPay(sellerId, storeId),
    loadOrderLock(sellerId),
    getTranslations("tallabyPayEarnings"),
    getLocale(),
  ]);
  if (!summary) notFound();

  const money = (value: string) => formatMoney(value, locale, EGP);
  const dir = moneyDir(locale, EGP);
  const appHref = `/stores/${storeId}/apps/tallaby-pay`;
  const hasHistory = sales.total > 0 || payouts.total > 0;

  if (!enabled && !hasHistory) {
    return (
      <SellerCard>
        <EmptyState
          icon={Banknote}
          title={t("empty.offTitle")}
          description={t("empty.offDescription")}
          action={
            <SellerButton asChild>
              <Link href={appHref}>{t("empty.openApp")}</Link>
            </SellerButton>
          }
        />
      </SellerCard>
    );
  }

  const negative = isNegativeAmount(summary.available);
  const pages = Math.max(1, Math.ceil(sales.total / sales.pageSize));
  const pageHref = (n: number) => (n > 1 ? `/stores/${storeId}/earnings?page=${n}#sales` : `/stores/${storeId}/earnings#sales`);

  const columns: Column<TallabyPaySaleView>[] = [
    {
      key: "order",
      header: t("sales.columns.order"),
      phone: "title",
      cell: (sale) => (
        <span className="flex flex-wrap items-center gap-1.5">
          {sale.orderId && sale.orderNumber && !ordersLocked ? (
            <Link
              href={`/orders?order=${sale.orderId}`}
              className="relative z-10 font-semibold text-(--s-link) underline-offset-2 hover:underline"
            >
              <bdi>{sale.orderNumber}</bdi>
            </Link>
          ) : (
            <span className="text-(--s-subtle)">{t("sales.orderHidden")}</span>
          )}
          {sale.purpose === "deposit" && <Tag tone="info">{t("sales.deposit")}</Tag>}
        </span>
      ),
    },
    {
      key: "date",
      header: t("sales.columns.date"),
      phone: "sub",
      cell: (sale) => (
        <span className="whitespace-nowrap">
          {formatDate(sale.paidAt, locale)}
          {sale.paymentMethod && <small className="block text-xs text-(--s-subtle)">{sale.paymentMethod}</small>}
        </span>
      ),
    },
    {
      key: "gross",
      header: t("sales.columns.paid"),
      phone: "hide",
      cell: (sale) => (
        <bdi dir={dir} className="font-montserrat tabular-nums">
          {money(sale.gross)}
        </bdi>
      ),
    },
    {
      key: "fee",
      header: t("sales.columns.fee"),
      phone: "hide",
      wideOnly: true,
      cell: (sale) => (
        <bdi dir={dir} className="font-montserrat text-(--s-subtle) tabular-nums">
          {money(sale.fee)}
        </bdi>
      ),
    },
    {
      key: "net",
      header: t("sales.columns.net"),
      phone: "end",
      cell: (sale) => (
        <bdi
          dir={dir}
          className={cn("font-montserrat font-bold tabular-nums", sale.status === "refunded" ? "text-(--s-subtle) line-through" : "text-(--s-ink)")}
        >
          {money(sale.net)}
        </bdi>
      ),
    },
    {
      key: "status",
      header: t("sales.columns.status"),
      phone: "endSub",
      cell: (sale) => {
        const state = saleState(sale);
        return (
          <Tag tone={SALE_STATE_TONE[state]}>
            {state === "pending_until" && sale.releaseAt
              ? t("sales.states.pending_until", { date: formatDate(sale.releaseAt, locale) })
              : t(`sales.states.${state}`)}
          </Tag>
        );
      },
    },
  ];

  return (
    <>
      <section
        aria-labelledby="earnings-title"
        className="sui-rise relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 overflow-hidden rounded-[28px] bg-(--s-setup) px-7 py-[26px] text-white max-[900px]:grid-cols-1 max-[720px]:rounded-[24px] max-[720px]:px-[18px] max-[720px]:py-[22px]"
      >
        <div className="relative flex min-w-0 flex-col gap-1.5">
          <h1 id="earnings-title" className="flex flex-wrap items-center gap-1.5 text-[13px] font-normal text-white/70">
            <Banknote className="size-[15px]" aria-hidden />
            {t("title", { store: storeName })}
            {summary.walletStatus === "frozen" && (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white">{t("frozenBadge")}</span>
            )}
          </h1>
          <p className="text-[13px] text-white/75">{t("available")}</p>
          <bdi
            dir={dir}
            className={cn(
              "font-montserrat text-[clamp(36px,5vw,52px)] font-extrabold leading-[1.1] tracking-[-.02em] tabular-nums",
              negative && "text-[#fca5a5]",
            )}
          >
            {money(summary.available)}
          </bdi>
          <p className="mt-1 max-w-[560px] text-pretty text-[13px] leading-[1.7] text-white/75">{t("howShort")}</p>
        </div>
        {!summary.withdrawBlock && !readOnly && (
          <div className="relative flex min-w-[220px] flex-col max-[900px]:min-w-0">
            <SellerButton asChild className="h-[50px] text-[15px]">
              <a href="#withdraw">
                <ArrowUpRight aria-hidden />
                {t("withdrawCta", { amount: money(summary.withdrawable) })}
              </a>
            </SellerButton>
          </div>
        )}
      </section>

      <StatStrip className="grid-cols-3 max-[1180px]:grid-cols-3 max-[720px]:grid-cols-1">
        <StatItem icon={Hourglass} tone="accent" label={t("pending")} value={<bdi dir={dir}>{money(summary.pending)}</bdi>} note={t("pendingNote")} />
        <StatItem icon={Clock} tone="info" label={t("reserved")} value={<bdi dir={dir}>{money(summary.reserved)}</bdi>} note={t("reservedNote")} />
        <StatItem icon={CircleCheck} tone="success" label={t("withdrawn")} value={<bdi dir={dir}>{money(summary.withdrawn)}</bdi>} note={t("withdrawnNote")} />
      </StatStrip>

      {negative && (
        <Note tone="danger" icon={AlertTriangle}>
          {t("negative")}
        </Note>
      )}
      {summary.walletStatus === "frozen" && (
        <Note tone="danger" icon={Snowflake}>
          {summary.frozenReason ? t("frozenWithReason", { reason: summary.frozenReason }) : t("frozen")}
        </Note>
      )}
      {!enabled && (
        <Note icon={Info}>
          {t.rich("offNote", { link: (chunks) => <Link href={appHref} className="font-semibold text-(--s-link) underline-offset-2 hover:underline">{chunks}</Link> })}
        </Note>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_380px] items-start gap-4 max-[1100px]:grid-cols-1">
        <div className="flex min-w-0 flex-col gap-4">
          <SellerCard id="sales" aria-labelledby="sales-title" className="scroll-mt-24">
            <SellerCardHeader id="sales-title" title={t("sales.title")} description={t("sales.description")} />
            {sales.rows.length === 0 ? (
              <EmptyState icon={ReceiptText} title={t("sales.empty")} description={t("sales.emptyHint")} />
            ) : (
              <div className="pb-2 pt-3.5">
                <ResponsiveTable label={t("sales.title")} columns={columns} rows={sales.rows} rowKey={(sale) => sale.id} />
              </div>
            )}
            {pages > 1 && (
              <nav aria-label={t("sales.pages")} className="flex items-center justify-center gap-2 pb-[18px]">
                {sales.page > 1 && (
                  <SellerButton asChild variant="mini" size="xs">
                    <Link href={pageHref(sales.page - 1)}>{t("sales.newer")}</Link>
                  </SellerButton>
                )}
                <span className="text-xs text-(--s-subtle)">{t("sales.pageOf", { page: sales.page, pages })}</span>
                {sales.page < pages && (
                  <SellerButton asChild variant="mini" size="xs">
                    <Link href={pageHref(sales.page + 1)}>{t("sales.older")}</Link>
                  </SellerButton>
                )}
              </nav>
            )}
          </SellerCard>

          <SellerCard aria-labelledby="payouts-title">
            <SellerCardHeader id="payouts-title" title={t("history.title")} />
            {payouts.rows.length === 0 ? (
              <EmptyState icon={ArrowUpRight} title={t("history.empty")} />
            ) : (
              <div className="p-4 pt-3.5">
                <Rows>
                  {payouts.rows.map((p) => (
                    <Row
                      key={p.id}
                      start={<IconTile icon={PAYOUT_ICON[p.status]} tone={p.status === "paid" ? "success" : p.status === "requested" ? "accent" : p.status === "cancelled" ? "neutral" : "danger"} />}
                      title={
                        <span className="flex flex-wrap items-center gap-2">
                          {t(`methods.${p.method}`)}
                          <Tag tone={PAYOUT_TONE[p.status]}>{t(`history.status.${p.status}`)}</Tag>
                        </span>
                      }
                      description={
                        <>
                          <bdi dir="ltr" data-clarity-mask="true">{p.destination}</bdi>
                          {" · "}
                          {formatDate(p.createdAt, locale)}
                          {p.status === "paid" && p.reference && <> · {t("history.reference", { reference: p.reference })}</>}
                          {(p.status === "rejected" || p.status === "reversed") && p.rejectionReason && <> · {p.rejectionReason}</>}
                        </>
                      }
                      end={
                        <bdi dir={dir} className="font-montserrat text-sm font-bold text-(--s-ink) tabular-nums">
                          {money(p.amount)}
                        </bdi>
                      }
                    />
                  ))}
                </Rows>
              </div>
            )}
          </SellerCard>
        </div>

        <div className="flex min-w-0 flex-col gap-4 max-[1100px]:order-first">
          <WithdrawCard
            storeId={storeId}
            readOnly={readOnly}
            withdrawable={summary.withdrawable}
            withdrawableText={money(summary.withdrawable)}
            minPayoutText={money(summary.minPayout)}
            block={summary.withdrawBlock}
            legalName={summary.kyc.status === "verified" ? summary.kyc.legalName : null}
            openPayout={
              summary.openPayout
                ? {
                    id: summary.openPayout.id,
                    amountText: money(summary.openPayout.amount),
                    method: summary.openPayout.method,
                    destination: summary.openPayout.destination,
                    dateText: formatDate(summary.openPayout.createdAt, locale),
                  }
                : null
            }
          />
          <KycCard
            storeId={storeId}
            status={summary.kyc.status}
            legalName={summary.kyc.legalName}
            idType={summary.kyc.idType}
            rejectionReason={summary.kyc.rejectionReason}
          />
        </div>
      </div>
    </>
  );
}
