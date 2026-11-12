import { BadgeCheck, Banknote, CircleCheck, CircleX, Clock, MessageCircle, Route, TrendingUp, UserPlus, Users, Wallet } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { REFERRAL_MIN_PAYOUT_PIASTRES, fromPiastres, referralShareUrl } from "@workspace/lib/referrals";
import { getReferralOverview, type ReferralPayoutView } from "@workspace/lib/referrals/server";
import { EmptyState, Note, ResponsiveTable, Row, Rows, SectionCard, SellerButton, SellerCard, StatusBadge, TwoColumns } from "@/components/seller-ui";
import { STOREFRONT_URL, getSupportWhatsAppUrl } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/i18n/format";
import { cn } from "@/lib/utils";
import { CopyLinkButton, ReferralLinkCard, WithdrawButton } from "./earn.client";

const STAT_ICONS = { earned: TrendingUp, available: Wallet, paid: CircleCheck } as const;
const HOW_STEPS = ["share", "topUp", "earn"] as const;

/**
 * Earn with us (F-37): earnings totals, the share link, how many referred
 * sellers reached $5 (the EGP 100 bonus), referred sellers and withdrawals. Never cached: money data is
 * read fresh on every request (CLAUDE.md rule 8).
 */
export async function EarnSection({ sellerId }: { sellerId: string }) {
  const [t, tSetup, locale, overview] = await Promise.all([
    getTranslations("earn"),
    getTranslations("storeSetup"),
    getLocale(),
    getReferralOverview(sellerId),
  ]);
  if (!overview) return null;

  const minimum = formatMoney(fromPiastres(REFERRAL_MIN_PAYOUT_PIASTRES), locale);
  const shareUrl = referralShareUrl(overview.code, STOREFRONT_URL);
  const bonus = formatMoney(overview.bonus, locale);
  const bonusNumber = String(Math.round(Number(overview.bonus)));
  const { referred, qualified } = overview.counts;
  const qualifiedPercent = referred > 0 ? Math.min(100, Math.round((qualified / referred) * 100)) : 0;

  return (
    <>
      {/* The hero is always dark, in both themes. */}
      <section className="sui-rise relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-5 overflow-hidden rounded-[28px] bg-(--tallaby-teal-900) p-7 text-white max-[600px]:grid-cols-1 max-[600px]:rounded-[24px] max-[600px]:p-5">
        <span aria-hidden className="pointer-events-none absolute -inset-y-1/2 start-[45%] end-[-10%] bg-[radial-gradient(50%_50%_at_50%_40%,rgb(253_173_40/.24),transparent_70%)]" />
        <div className="relative min-w-0">
          <h1 className="text-[clamp(22px,3vw,30px)] font-bold leading-[1.35]">{t("title")}</h1>
          <p className="mt-1.5 max-w-[560px] text-pretty text-sm text-[#c6d8dc]">{t("intro", { bonus })}</p>
        </div>
        <div className="relative grid size-[120px] place-items-center rounded-full border border-white/10 bg-white/5 text-center max-[600px]:size-[96px]">
          <div>
            <b dir="ltr" className="block font-montserrat text-[34px] font-extrabold leading-none text-(--tallaby-amber-600) max-[600px]:text-[26px]">
              {bonusNumber}
            </b>
            <small className="text-[11.5px] text-[#c6d8dc]">{tSetup("perTopUp")}</small>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
        {(
          [
            ["earned", overview.earned],
            ["available", overview.available],
            ["paid", overview.paid],
          ] as const
        ).map(([key, value]) => {
          const Icon = STAT_ICONS[key];
          return (
            <SellerCard key={key} className={cn("flex flex-col gap-1 px-5 py-[18px]", key === "available" && "border-(--tallaby-teal-100) bg-(--s-tint) dark:border-(--s-line)")}>
              <small className="flex items-center gap-1.5 text-[12.5px] text-(--s-subtle)">
                <Icon className="size-[15px]" aria-hidden />
                {t(`stats.${key}`)}
              </small>
              <b className="font-montserrat text-2xl font-extrabold text-(--s-ink) tabular-nums">{formatMoney(value, locale)}</b>
            </SellerCard>
          );
        })}
      </div>

      <ReferralLinkCard url={shareUrl} code={overview.code} />

      <SectionCard icon={Route} title={tSetup("howTitle")}>
        <ol className="grid grid-cols-3 gap-3 max-[720px]:grid-cols-1">
          {HOW_STEPS.map((step, index) => (
            <li key={step} className="flex flex-col gap-1.5 rounded-[18px] border border-(--s-line-soft) bg-(--s-tint) p-4">
              <span className="grid size-[30px] place-items-center rounded-full bg-accent font-montserrat text-[13px] font-extrabold text-(--tallaby-teal-900)">{index + 1}</span>
              <b className="text-sm font-bold text-(--s-ink)">{tSetup(`how.${step}.title`)}</b>
              <small className="text-[12.5px] leading-[1.7] text-(--s-muted)">{tSetup(`how.${step}.body`, { bonus })}</small>
            </li>
          ))}
        </ol>
      </SectionCard>

      <TwoColumns>
        <SectionCard icon={BadgeCheck} tone={qualified > 0 ? "success" : "accent"} title={t("progress.title")}>
          <div className="flex flex-col gap-1.5">
            <p className="text-[13px] text-(--s-text) tabular-nums">{t("progress.referred", { count: referred })}</p>
            <p className="text-[13px] text-(--s-text) tabular-nums">{t("progress.qualified", { count: qualified })}</p>
            <span role="progressbar" aria-valuenow={qualified} aria-valuemin={0} aria-valuemax={Math.max(referred, 1)} aria-label={t("progress.qualified", { count: qualified })} className="block h-2 overflow-hidden rounded-full bg-(--s-fill)">
              <i className="block h-full rounded-full bg-(--s-primary)" style={{ width: `${qualifiedPercent}%` }} />
            </span>
          </div>
          <p className="text-pretty text-xs text-(--s-faint)">{t("progress.rule", { bonus })}</p>
        </SectionCard>

        <SectionCard icon={Banknote} title={t("withdraw.title")} description={t("withdraw.minimum", { amount: minimum })}>
          {overview.blockReason && <Note>{t(`withdraw.blocked.${overview.blockReason}`, { amount: minimum })}</Note>}
          <div className="flex flex-wrap gap-2">
            <WithdrawButton disabled={overview.blockReason !== null} amountLabel={formatMoney(overview.available, locale)} />
            <SellerButton variant="mini" size="sm" asChild>
              <a href={getSupportWhatsAppUrl(t("withdraw.supportMessage"))} target="_blank" rel="noreferrer">
                <MessageCircle aria-hidden />
                {t("withdraw.support")}
              </a>
            </SellerButton>
          </div>
          {overview.payouts.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[13.5px] font-bold text-(--s-text)">{t("payouts.title")}</p>
              <Rows>
                {overview.payouts.map((p) => (
                  <PayoutRow key={p.id} payout={p} locale={locale} t={t} />
                ))}
              </Rows>
            </div>
          )}
        </SectionCard>
      </TwoColumns>

      <SectionCard icon={Users} title={t("referrals.title")}>
        {overview.referrals.length === 0 ? (
          <EmptyState icon={UserPlus} title={t("referrals.empty")} action={<CopyLinkButton url={shareUrl} />} />
        ) : (
          <ResponsiveTable
            label={t("referrals.title")}
            rows={overview.referrals.map((r, index) => ({ ...r, index }))}
            rowKey={(r) => String(r.index)}
            columns={[
              { key: "store", header: t("referrals.store"), phone: "title", cell: (r) => r.storeName ?? t("referrals.unnamed") },
              { key: "signedUp", header: t("referrals.signedUp"), phone: "sub", cell: (r) => (r.signedUpAt ? formatDate(r.signedUpAt, locale) : "—") },
              { key: "stores", header: t("referrals.stores"), phone: "full", cell: (r) => <span className="tabular-nums">{r.stores}</span> },
              {
                key: "toppedUp",
                header: t("referrals.toppedUp"),
                phone: "full",
                cell: (r) => (
                  <span className="inline-flex flex-wrap items-center gap-1.5">
                    <span className="tabular-nums">{formatMoney(r.toppedUp, locale, { currency: "USD" })}</span>
                    {r.qualified && <StatusBadge tone="success">{t("referrals.qualified")}</StatusBadge>}
                  </span>
                ),
              },
              { key: "commission", header: t("referrals.commission"), phone: "end", cell: (r) => <b className="font-bold tabular-nums">{formatMoney(r.commission, locale)}</b> },
            ]}
          />
        )}
      </SectionCard>
    </>
  );
}

const STATUS = {
  requested: { icon: Clock, tone: "warning" },
  paid: { icon: CircleCheck, tone: "success" },
  rejected: { icon: CircleX, tone: "danger" },
} as const;

function PayoutRow({
  payout,
  locale,
  t,
}: {
  payout: ReferralPayoutView;
  locale: string;
  t: Awaited<ReturnType<typeof getTranslations<"earn">>>;
}) {
  const { icon: Icon, tone } = STATUS[payout.status];
  return (
    <Row
      className="flex-wrap"
      start={<Icon className="size-4 shrink-0 text-(--s-subtle)" aria-hidden />}
      title={<span className="font-montserrat tabular-nums">{formatMoney(payout.amount, locale)}</span>}
      description={
        <>
          <span className="block">
            {payout.destination} · {formatDate(payout.createdAt, locale)}
          </span>
          {payout.status === "paid" && payout.reference && <span className="block">{t("payouts.reference", { reference: payout.reference })}</span>}
          {payout.status === "rejected" && payout.rejectionReason && <span className="block">{t("payouts.reason", { reason: payout.rejectionReason })}</span>}
        </>
      }
      end={<StatusBadge tone={tone}>{t(`payouts.status.${payout.status}`)}</StatusBadge>}
    />
  );
}
