import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Check, Gem, Minus, Receipt, Store } from "lucide-react";
import { and, db, eq, gte, orderItems, sellers, sql } from "@workspace/db";
import { isProActive } from "@workspace/lib/billing";
import { getAiCreditStatus } from "@workspace/lib/billing/credits";
import { getBillingState } from "@workspace/lib/billing/server";
import { FEE_TRIAL_DAYS, STANDARD_FEE_MIN_PIASTRES } from "@workspace/lib/orders";
import { getPlanLimits, resolvePlanId, type PlanFeatures } from "@workspace/lib/plans";
import { getFeeTrialStatus, type FeeTrialStatus } from "@workspace/lib/sellers";
import { PageContainer, PageHeader, Row, Rows, SectionCard, SellerButton, Tag } from "@/components/seller-ui";
import { formatDate, formatMoney } from "@/lib/i18n/format";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { getStoreWalletBalance } from "../../wallet/store-wallet.server";
import { PlanLive } from "./plan-live.client";

const FEATURES: (keyof PlanFeatures)[] = ["customDomain", "ai", "advancedSettings", "removeTallabyBadge"];

/**
 * Plan & usage (PLAN.md §7.3, P3-05). Everyone is on Free for now; limits come
 * from the plans module (@workspace/lib/plans). No prices until paid plans exist.
 */
export default async function PlanPage() {
  if ((await getBillingState()).usdLive) return <LivePlanPage />;
  const [seller, { stores, maxStores }, t] = await Promise.all([
    requireSeller(),
    getSellerStores(),
    getTranslations("planUsage"),
  ]);
  const [trial, locale] = await Promise.all([loadFeeTrial(seller.sellerId), getLocale()]);
  const planId = resolvePlanId(seller.plan);
  const limits = getPlanLimits(planId);
  const used = stores.length;

  return (
    <PageContainer narrow>
      <PageHeader title={t("title")} description={t("description")} />

      <SectionCard
        id="plan"
        icon={Gem}
        title={
          <>
            {t("currentPlan")}
            <Tag tone="info">{t(`plans.${planId}`)}</Tag>
          </>
        }
        description={t("currentPlanDescription")}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[13.5px]">
            <span className="flex items-center gap-2 font-bold text-(--s-text)">
              <Store className="size-4 text-(--s-subtle)" aria-hidden />
              {t("stores")}
            </span>
            <span className="text-(--s-muted) tabular-nums">{t("storesUsage", { count: used, max: maxStores })}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-(--s-fill)" aria-hidden>
            <div className="h-full rounded-full bg-(--s-primary)" style={{ width: `${Math.min(100, (used / Math.max(maxStores, 1)) * 100)}%` }} />
          </div>
          {used >= maxStores && <p className="text-xs text-(--s-subtle)">{t("storesFull")}</p>}
        </div>

        <Rows>
          {FEATURES.map((feature) => {
            const included = limits[feature];
            return (
              <Row
                key={feature}
                start={
                  included ? (
                    <Check className="size-4 shrink-0 text-success" aria-hidden />
                  ) : (
                    <Minus className="size-4 shrink-0 text-(--s-subtle)" aria-hidden />
                  )
                }
                title={<span className="font-semibold">{t(`features.${feature}`)}</span>}
                end={<Tag tone={included ? "success" : "muted"}>{included ? t("included") : t("notOnPlan")}</Tag>}
              />
            );
          })}
        </Rows>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-(--s-tint) px-3.5 py-3 text-[13px] text-(--s-muted)">
          <span>{t("upgradesSoon")}</span>
          <SellerButton asChild variant="mini" size="xs">
            <Link href="/stores">{t("manageStores")}</Link>
          </SellerButton>
        </div>
      </SectionCard>

      {/* The seller's real cost today (PLAN.md §13): the per-order fee and the free trial. */}
      <SectionCard
        id="fees"
        icon={Receipt}
        title={t("fees")}
        description={t("feesDescription")}
        action={
          <SellerButton asChild variant="mini" size="xs">
            <Link href="/wallet">{t("viewWallet")}</Link>
          </SellerButton>
        }
      >
        <Rows>
          <Row
            title={<span className="font-semibold">{t("feeLine")}</span>}
            end={
              <bdi dir="ltr" className="font-montserrat text-sm font-bold text-(--s-ink) tabular-nums">
                {formatMoney(STANDARD_FEE_MIN_PIASTRES / 100, locale)}
              </bdi>
            }
          />
          {trial.state !== "none" && (
            <Row
              description={
                trial.state === "active"
                  ? t("trialActive", { days: trial.daysLeft, date: formatDate(trial.endsAt, locale) })
                  : trial.state === "ended"
                    ? t("trialEnded", { date: formatDate(trial.endsAt, locale) })
                    : t("trialNotStarted", { days: FEE_TRIAL_DAYS })
              }
            />
          )}
        </Rows>
      </SectionCard>
    </PageContainer>
  );
}

/** Plan & usage once the new pricing is live (ROADMAP.md F-55e). */
async function LivePlanPage() {
  const seller = await requireSeller();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const [[row], credits, wallet, [orderCount]] = await Promise.all([
    db
      .select({
        plan: sellers.plan,
        planExpiresAt: sellers.planExpiresAt,
        planGraceUntil: sellers.planGraceUntil,
        planCancelAtPeriodEnd: sellers.planCancelAtPeriodEnd,
        planAdminGranted: sellers.planAdminGranted,
      })
      .from(sellers)
      .where(eq(sellers.id, seller.sellerId)),
    getAiCreditStatus(seller.sellerId),
    getStoreWalletBalance(seller.sellerId),
    db
      .select({ count: sql<number>`count(DISTINCT ${orderItems.orderId})::int` })
      .from(orderItems)
      .where(and(eq(orderItems.sellerId, seller.sellerId), gte(orderItems.createdAt, since))),
  ]);
  return (
    <PlanLive
      isPro={row ? isProActive(row) : false}
      periodEnd={row?.planExpiresAt ?? null}
      cancelAtPeriodEnd={row?.planCancelAtPeriodEnd ?? false}
      graceUntil={row?.planGraceUntil ?? null}
      adminGranted={row?.planAdminGranted ?? false}
      credits={credits}
      walletBalance={wallet?.balance ?? 0}
      ordersLast30Days={orderCount?.count ?? 0}
    />
  );
}

async function loadFeeTrial(sellerId: string): Promise<FeeTrialStatus> {
  const [row] = await db
    .select({
      feeTrialEligible: sellers.feeTrialEligible,
      feeTrialStartedAt: sellers.feeTrialStartedAt,
      feeTrialEndsAt: sellers.feeTrialEndsAt,
    })
    .from(sellers)
    .where(eq(sellers.id, sellerId))
    .limit(1);
  return row ? getFeeTrialStatus(row) : { state: "none" };
}
