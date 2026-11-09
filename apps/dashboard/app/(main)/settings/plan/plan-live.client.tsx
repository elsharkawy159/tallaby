"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, LoaderCircle, Minus, Plus, Sparkles } from "lucide-react";
import {
  CREDIT_PACK_CREDITS,
  CREDIT_PACK_USD_CENTS,
  EMAIL_PACK_EMAILS,
  EMAIL_PACK_USD_CENTS,
  FREE_ORDER_FEE_USD_CENTS,
  PRO_MONTHLY_USD_CENTS,
  TOP_UP_MIN_USD_CENTS,
} from "@workspace/lib/billing";
import type { AiCreditStatus } from "@workspace/lib/billing/credits";
import { AI_CREDITS_MONTHLY_NOT_ACTIVATED, PLANS } from "@workspace/lib/plans";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { Note, PageContainer, PageHeader, SellerButton, SellerCard, Tag, TwoColumns } from "@/components/seller-ui";
import { formatDate, formatNumber, formatUsdPrice, formatWalletMoney } from "@/lib/i18n/format";
import { useEgpRate } from "@/components/egp-rate.client";
import { cn } from "@/lib/utils";
import { buyCreditPacksAction, setPlanCancelAction, upgradeToProAction, type PlanActionState } from "./plan.server";

export type PlanLiveProps = {
  isPro: boolean;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  graceUntil: string | null;
  adminGranted: boolean;
  credits: AiCreditStatus;
  walletBalance: number;
  /** Null for a seller who isn't activated: no order numbers yet (ROADMAP.md F-68). */
  ordersLast30Days: number | null;
};



/**
 * Plan & usage once the new pricing is live (ROADMAP.md F-55e). The page answers
 * the seller's real question with their own number: at the orders you actually
 * got, what would each plan have cost you?
 */
export function PlanLive(props: PlanLiveProps) {
  const { isPro, periodEnd, cancelAtPeriodEnd, graceUntil, adminGranted, credits, walletBalance, ordersLast30Days } = props;
  const t = useTranslations("planLive");
  const locale = useLocale();
  // Every price here shows in EGP at the live rate (owner, 2026-11-09); the plan prices stay in USD.
  const egpRate = useEgpRate();
  const usd = (cents: number) => formatUsdPrice(cents, locale, egpRate);
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<"upgrade" | "cancel" | null>(null);
  const [packs, setPacks] = useState(1);

  const freeCost = (ordersLast30Days ?? 0) * FREE_ORDER_FEE_USD_CENTS;
  const proSaves = freeCost > PRO_MONTHLY_USD_CENTS;
  const canAffordPro = walletBalance * 100 >= PRO_MONTHLY_USD_CENTS;
  const packCost = packs * CREDIT_PACK_USD_CENTS;
  const canAffordPacks = walletBalance * 100 >= packCost;
  const format1000 = formatNumber(EMAIL_PACK_EMAILS, locale);
  const monthlyUsed = credits.monthlyAllowance - credits.monthlyRemaining;
  const monthlyShare = credits.monthlyAllowance > 0 ? Math.min(100, (credits.monthlyRemaining / credits.monthlyAllowance) * 100) : 0;

  const act = (work: () => Promise<PlanActionState>, done: string) =>
    startTransition(async () => {
      const result = await work();
      setConfirm(null);
      if (result.success) toast.success(done);
      else toast.error(t(`errors.${result.error}`));
    });

  const planLine = (
    <>
      {isPro ? t("yourPlanPro") : t("yourPlanFree")}
      {isPro && periodEnd && !adminGranted && (
        <> {cancelAtPeriodEnd ? t("endsOn", { date: formatDate(periodEnd, locale) }) : t("renewsOn", { date: formatDate(periodEnd, locale) })}</>
      )}
      {isPro && adminGranted && <> {periodEnd ? t("grantedUntil", { date: formatDate(periodEnd, locale) }) : t("granted")}</>}
    </>
  );

  return (
    <PageContainer narrow>
      <PageHeader title={t("title")} />

      {graceUntil && (
        <Note tone="danger" className="text-[13px]">
          <span role="alert">
            {t("grace", { date: formatDate(graceUntil, locale) })}{" "}
            <Link href="/wallet?topup=1" className="underline">
              {t("topUp")}
            </Link>
          </span>
        </Note>
      )}

      {/* The seller's own numbers come first; they decide which plan makes sense. */}
      <section className="sui-rise relative overflow-hidden rounded-[28px] bg-(--s-setup) px-7 py-[26px] text-white before:pointer-events-none before:absolute before:inset-x-[40%_-10%] before:-top-[70%] before:h-[170%] before:bg-[radial-gradient(50%_50%_at_50%_40%,rgb(253_173_40/0.2),transparent_70%)] max-[720px]:rounded-[24px] max-[720px]:px-[18px] max-[720px]:py-[22px]">
        <div className="relative">
          {ordersLast30Days === null ? (
            <h2 className="text-balance text-[clamp(20px,2.4vw,26px)] font-bold leading-snug text-white">{planLine}</h2>
          ) : (
            <>
              <p className="text-[13px] text-white/70">{planLine}</p>
              <h2 className="mt-1.5 text-balance text-[clamp(20px,2.4vw,26px)] font-bold leading-snug text-white">
                {t("ordersHeadline", { count: ordersLast30Days })}
              </h2>
              <p className="mt-1.5 max-w-prose text-pretty text-sm text-white/75">
                {isPro
                  ? t("proSummary", { fees: usd(freeCost) })
                  : proSaves
                    ? t("freeButProSaves", { fees: usd(freeCost), saves: usd(freeCost - PRO_MONTHLY_USD_CENTS) })
                    : t("freeIsRight", { fees: usd(freeCost) })}
              </p>
            </>
          )}
        </div>
      </section>

      {/* The two plans, side by side. Only what differs. */}
      <TwoColumns className="items-stretch gap-3.5">
        {(
          [
            { id: "free", price: t("freePrice"), fee: usd(FREE_ORDER_FEE_USD_CENTS), credits: credits.notActivated ? credits.monthlyAllowance : PLANS.free.aiCreditsMonthly, emails: PLANS.free.emailsMonthly, current: !isPro },
            { id: "pro", price: t("proPrice", { amount: usd(PRO_MONTHLY_USD_CENTS) }), fee: t("noFee"), credits: PLANS.pro.aiCreditsMonthly, emails: PLANS.pro.emailsMonthly, current: isPro },
          ] as const
        ).map((plan) => (
          <SellerCard
            key={plan.id}
            className={cn(
              "flex flex-col p-[22px] max-[720px]:p-4",
              plan.current && "border-(--s-primary) shadow-[0_0_0_3px_var(--s-focus-soft)]",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[16.5px] font-bold text-(--s-ink)">{t(`plans.${plan.id}`)}</h3>
              {plan.current && <Tag tone="info">{t("current")}</Tag>}
            </div>
            <p className="mt-1 font-montserrat text-[26px] font-extrabold text-(--s-ink) tabular-nums">
              <bdi>{plan.price}</bdi>
            </p>
            <ul className="mt-3.5 flex flex-1 flex-col gap-2.5 text-[13px] text-(--s-body)">
              {[t("feeLine", { fee: plan.fee }), t("creditsLine", { count: plan.credits }), t("emailsLine", { count: plan.emails }), t("emailsExtra", { price: usd(EMAIL_PACK_USD_CENTS), emails: format1000 }), t("unlimited"), t("everythingElse")].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {plan.id === "pro" && !isPro && (
              <div className="mt-5">
                {canAffordPro ? (
                  <SellerButton className="w-full" disabled={isPending} onClick={() => setConfirm("upgrade")}>
                    <Sparkles aria-hidden />
                    {t("upgrade")}
                  </SellerButton>
                ) : (
                  <>
                    <SellerButton asChild variant="outline" className="w-full">
                      <Link href="/wallet?topup=1">{t("topUpFirst")}</Link>
                    </SellerButton>
                    <p className="mt-2 text-xs text-(--s-subtle)">
                      {t("needBalance", {
                        amount: usd(PRO_MONTHLY_USD_CENTS),
                        balance: formatWalletMoney(walletBalance, "USD", locale, egpRate),
                      })}
                    </p>
                  </>
                )}
              </div>
            )}
            {plan.id === "pro" && isPro && !adminGranted && (
              <div className="mt-5">
                {cancelAtPeriodEnd ? (
                  <SellerButton
                    variant="outline"
                    className="w-full"
                    disabled={isPending}
                    onClick={() => act(() => setPlanCancelAction(false), t("resumed"))}
                  >
                    {t("resume")}
                  </SellerButton>
                ) : (
                  <SellerButton variant="mini" className="w-full" disabled={isPending} onClick={() => setConfirm("cancel")}>
                    {t("cancel")}
                  </SellerButton>
                )}
              </div>
            )}
          </SellerCard>
        ))}
      </TwoColumns>

      {/* AI credits */}
      <SellerCard className="p-[22px] max-[720px]:p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[16.5px] font-bold text-(--s-ink)">{t("creditsTitle")}</h2>
            <p className="mt-0.5 text-pretty text-[13px] text-(--s-subtle)">{t("creditsHelp")}</p>
          </div>
          <p className="font-montserrat text-[28px] font-extrabold leading-none text-(--s-ink) tabular-nums">{formatNumber(credits.total, locale)}</p>
        </div>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-(--s-fill)"
          role="progressbar"
          aria-label={t("monthlyLeft", { left: credits.monthlyRemaining, total: credits.monthlyAllowance })}
          aria-valuenow={credits.monthlyRemaining}
          aria-valuemin={0}
          aria-valuemax={credits.monthlyAllowance}
        >
          <div className="h-full rounded-full bg-(--s-primary) transition-[width]" style={{ width: `${monthlyShare}%` }} />
        </div>
        <p className="mt-2 text-xs text-(--s-subtle)">
          {t("monthlyLeft", { left: credits.monthlyRemaining, total: credits.monthlyAllowance })}
          {credits.purchasedRemaining > 0 && <> {t("purchasedLeft", { count: credits.purchasedRemaining })}</>}
          {monthlyUsed > 0 && credits.plan === "free" && <> {t("resetsFree")}</>}
        </p>
        {credits.notActivated && (
          <Note tone="amber" className="mt-3">
            {t("creditsNotActivated", { locked: AI_CREDITS_MONTHLY_NOT_ACTIVATED, full: PLANS.free.aiCreditsMonthly, min: usd(TOP_UP_MIN_USD_CENTS) })}{" "}
            <Link href="/wallet" className="underline underline-offset-2">
              {t("topUpFirst")}
            </Link>
          </Note>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-(--s-line-soft) pt-5">
          <div className="inline-flex h-11 items-stretch overflow-hidden rounded-[14px] border-[1.5px] border-(--s-field) bg-(--s-surface)">
            <button
              type="button"
              aria-label={t("fewerPacks")}
              disabled={packs <= 1}
              onClick={() => setPacks((n) => Math.max(1, n - 1))}
              className="grid w-11 cursor-pointer place-items-center text-(--s-primary) transition-colors duration-150 hover:bg-(--s-hover) disabled:pointer-events-none disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="grid min-w-20 place-items-center text-center text-[13px] font-bold text-(--s-ink) tabular-nums">
              {t("creditsCount", { count: packs * CREDIT_PACK_CREDITS })}
            </span>
            <button
              type="button"
              aria-label={t("morePacks")}
              disabled={packs >= 20}
              onClick={() => setPacks((n) => Math.min(20, n + 1))}
              className="grid w-11 cursor-pointer place-items-center text-(--s-primary) transition-colors duration-150 hover:bg-(--s-hover) disabled:pointer-events-none disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
          {canAffordPacks ? (
            <SellerButton
              variant="outline"
              disabled={isPending}
              onClick={() => act(() => buyCreditPacksAction(packs), t("bought", { count: packs * CREDIT_PACK_CREDITS }))}
            >
              {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
              {t("buy", { amount: usd(packCost) })}
            </SellerButton>
          ) : (
            <SellerButton asChild variant="outline">
              <Link href="/wallet?topup=1">{t("topUpFirst")}</Link>
            </SellerButton>
          )}
          <span className="text-xs text-(--s-subtle)">{t("buyNote")}</span>
        </div>
      </SellerCard>

      <ConfirmActionDialog
        open={confirm !== null}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm === "upgrade" ? t("confirmUpgradeTitle", { amount: usd(PRO_MONTHLY_USD_CENTS) }) : t("confirmCancelTitle")}
        description={confirm === "upgrade" ? t("confirmUpgradeBody") : t("confirmCancelBody", { date: periodEnd ? formatDate(periodEnd, locale) : "" })}
        confirmLabel={confirm === "upgrade" ? t("upgrade") : t("cancel")}
        cancelLabel={t("back")}
        destructive={confirm === "cancel"}
        pending={isPending}
        onConfirm={() =>
          confirm === "upgrade"
            ? act(upgradeToProAction, t("upgraded"))
            : act(() => setPlanCancelAction(true), t("cancelled"))
        }
      />
    </PageContainer>
  );
}
