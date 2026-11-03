"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Check, LoaderCircle, Minus, Plus, Sparkles } from "lucide-react";
import {
  CREDIT_PACK_CREDITS,
  CREDIT_PACK_USD_CENTS,
  FREE_ORDER_FEE_USD_CENTS,
  PRO_MONTHLY_USD_CENTS,
} from "@workspace/lib/billing";
import type { AiCreditStatus } from "@workspace/lib/billing/credits";
import { Button } from "@workspace/ui/components/button";
import { ConfirmActionDialog } from "@/components/layout/confirm-action-dialog.client";
import { formatDate, formatNumber, formatWalletMoney } from "@/lib/i18n/format";
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
  ordersLast30Days: number;
};

const usd = (cents: number) => formatWalletMoney(cents / 100, "USD", "en");

/**
 * Plan & usage once the new pricing is live (ROADMAP.md F-55e). The page answers
 * the seller's real question with their own number: at the orders you actually
 * got, what would each plan have cost you?
 */
export function PlanLive(props: PlanLiveProps) {
  const { isPro, periodEnd, cancelAtPeriodEnd, graceUntil, adminGranted, credits, walletBalance, ordersLast30Days } = props;
  const t = useTranslations("planLive");
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<"upgrade" | "cancel" | null>(null);
  const [packs, setPacks] = useState(1);

  const freeCost = ordersLast30Days * FREE_ORDER_FEE_USD_CENTS;
  const proSaves = freeCost > PRO_MONTHLY_USD_CENTS;
  const canAffordPro = walletBalance * 100 >= PRO_MONTHLY_USD_CENTS;
  const packCost = packs * CREDIT_PACK_USD_CENTS;
  const canAffordPacks = walletBalance * 100 >= packCost;
  const monthlyUsed = credits.monthlyAllowance - credits.monthlyRemaining;
  const monthlyShare = credits.monthlyAllowance > 0 ? Math.min(100, (credits.monthlyRemaining / credits.monthlyAllowance) * 100) : 0;

  const act = (work: () => Promise<PlanActionState>, done: string) =>
    startTransition(async () => {
      const result = await work();
      setConfirm(null);
      if (result.success) toast.success(done);
      else toast.error(t(`errors.${result.error}`));
    });

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6">
      {graceUntil && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive-soft px-4 py-3 text-sm text-destructive">
          {t("grace", { date: formatDate(graceUntil, locale) })}{" "}
          <Link href="/wallet?topup=1" className="font-semibold underline">
            {t("topUp")}
          </Link>
        </p>
      )}

      {/* The seller's own numbers come first; they decide which plan makes sense. */}
      <div className="rounded-2xl border bg-card p-5 sm:p-7">
        <p className="text-sm text-muted-foreground">
          {isPro ? t("yourPlanPro") : t("yourPlanFree")}
          {isPro && periodEnd && !adminGranted && (
            <> {cancelAtPeriodEnd ? t("endsOn", { date: formatDate(periodEnd, locale) }) : t("renewsOn", { date: formatDate(periodEnd, locale) })}</>
          )}
          {isPro && adminGranted && <> {periodEnd ? t("grantedUntil", { date: formatDate(periodEnd, locale) }) : t("granted")}</>}
        </p>
        <h2 className="mt-2 text-2xl leading-snug font-bold text-balance sm:text-3xl">
          {t("ordersHeadline", { count: ordersLast30Days })}
        </h2>
        <p className="mt-2 max-w-prose text-pretty text-muted-foreground">
          {isPro
            ? t("proSummary", { fees: usd(freeCost) })
            : proSaves
              ? t("freeButProSaves", { fees: usd(freeCost), saves: usd(freeCost - PRO_MONTHLY_USD_CENTS) })
              : t("freeIsRight", { fees: usd(freeCost) })}
        </p>
      </div>

      {/* The two plans, side by side. Only what differs. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            { id: "free", price: t("freePrice"), fee: usd(FREE_ORDER_FEE_USD_CENTS), credits: 100, current: !isPro },
            { id: "pro", price: t("proPrice", { amount: usd(PRO_MONTHLY_USD_CENTS) }), fee: t("noFee"), credits: 2000, current: isPro },
          ] as const
        ).map((plan) => (
          <article
            key={plan.id}
            className={cn("flex flex-col rounded-2xl border p-5", plan.current ? "border-primary bg-primary-soft/40" : "bg-card")}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-bold">{t(`plans.${plan.id}`)}</h3>
              {plan.current && <span className="text-xs font-semibold text-primary-ink">{t("current")}</span>}
            </div>
            <p className="mt-1 text-2xl font-extrabold tabular-nums">
              <bdi>{plan.price}</bdi>
            </p>
            <ul className="mt-4 flex-1 space-y-2.5 text-sm">
              {[t("feeLine", { fee: plan.fee }), t("creditsLine", { count: plan.credits }), t("unlimited"), t("everythingElse")].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            {plan.id === "pro" && !isPro && (
              <div className="mt-5">
                {canAffordPro ? (
                  <Button type="button" className="w-full" disabled={isPending} onClick={() => setConfirm("upgrade")}>
                    <Sparkles aria-hidden />
                    {t("upgrade")}
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/wallet?topup=1">{t("topUpFirst")}</Link>
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("needBalance", {
                        amount: usd(PRO_MONTHLY_USD_CENTS),
                        balance: formatWalletMoney(walletBalance, "USD", locale),
                      })}
                    </p>
                  </>
                )}
              </div>
            )}
            {plan.id === "pro" && isPro && !adminGranted && (
              <div className="mt-5">
                {cancelAtPeriodEnd ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isPending}
                    onClick={() => act(() => setPlanCancelAction(false), t("resumed"))}
                  >
                    {t("resume")}
                  </Button>
                ) : (
                  <Button type="button" variant="ghost" className="w-full text-muted-foreground" disabled={isPending} onClick={() => setConfirm("cancel")}>
                    {t("cancel")}
                  </Button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {/* AI credits */}
      <div className="rounded-2xl border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-bold">{t("creditsTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("creditsHelp")}</p>
          </div>
          <p className="text-3xl font-extrabold tabular-nums">{formatNumber(credits.total, locale)}</p>
        </div>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label={t("monthlyLeft", { left: credits.monthlyRemaining, total: credits.monthlyAllowance })}
          aria-valuenow={credits.monthlyRemaining}
          aria-valuemin={0}
          aria-valuemax={credits.monthlyAllowance}
        >
          <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${monthlyShare}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("monthlyLeft", { left: credits.monthlyRemaining, total: credits.monthlyAllowance })}
          {credits.purchasedRemaining > 0 && <> {t("purchasedLeft", { count: credits.purchasedRemaining })}</>}
          {monthlyUsed > 0 && credits.plan === "free" && <> {t("resetsFree")}</>}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3 border-t pt-5">
          <div className="inline-flex items-center rounded-xl border">
            <button
              type="button"
              aria-label={t("fewerPacks")}
              disabled={packs <= 1}
              onClick={() => setPacks((n) => Math.max(1, n - 1))}
              className="grid size-11 place-items-center text-muted-foreground disabled:opacity-40"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <span className="min-w-20 text-center text-sm font-semibold tabular-nums">
              {t("creditsCount", { count: packs * CREDIT_PACK_CREDITS })}
            </span>
            <button
              type="button"
              aria-label={t("morePacks")}
              disabled={packs >= 20}
              onClick={() => setPacks((n) => Math.min(20, n + 1))}
              className="grid size-11 place-items-center text-muted-foreground disabled:opacity-40"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
          {canAffordPacks ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => act(() => buyCreditPacksAction(packs), t("bought", { count: packs * CREDIT_PACK_CREDITS }))}
            >
              {isPending && <LoaderCircle className="animate-spin" aria-hidden />}
              {t("buy", { amount: usd(packCost) })}
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/wallet?topup=1">{t("topUpFirst")}</Link>
            </Button>
          )}
          <span className="text-xs text-muted-foreground">{t("buyNote")}</span>
        </div>
      </div>

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
    </section>
  );
}
