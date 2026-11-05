import { CalendarRange, Clock, FileText, Info } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

import { getUser } from "@/actions/auth";
import { Note, PageContainer, PageHeader, SectionCard, StatusBadge, Tag, type BadgeTone } from "@/components/seller-ui";
import {
  FULFILLMENT_SERVICE_TYPES,
  TALLABY_SERVICES_ENABLED,
  choiceMatchesService,
  getPlanPricingLabel,
  localizedPlanName,
  type AgreementRate,
  type FulfillmentAgreementStatus,
  type FulfillmentPlanView,
  type FulfillmentProvider,
  type FulfillmentServiceStatus,
  type ServiceConfig,
} from "@workspace/lib/fulfillment";
import {
  getSellerFulfillmentOverview,
  type SellerFulfillmentAgreementRow,
} from "@workspace/lib/fulfillment/server";
import { FulfillmentRequestForm } from "./fulfillment-request.client";
import { initialRequestValues } from "./fulfillment-request.lib";

// Reads the signed-in seller's configuration from the session cookie.
export const dynamic = "force-dynamic";

/**
 * Agreement states a seller sees. Drafts are still being prepared internally;
 * superseded/terminated terms no longer apply. Admin notes are never shown.
 */
const SELLER_VISIBLE_AGREEMENTS: FulfillmentAgreementStatus[] = ["active", "accepted", "proposed"];

const AGREEMENT_TONES: Partial<Record<FulfillmentAgreementStatus, BadgeTone>> = {
  active: "success",
  accepted: "info",
  proposed: "warning",
};

const STATUS_TONES: Record<FulfillmentServiceStatus, BadgeTone> = {
  requested: "warning",
  under_review: "info",
  awaiting_agreement: "info",
  active: "success",
  paused: "muted",
  rejected: "danger",
};

export default async function FulfillmentSetupPage() {
  // Hidden while Tallaby offers no storage, packing or delivery (owner, 2026-10-31).
  if (!TALLABY_SERVICES_ENABLED) notFound();
  const t = await getTranslations("fulfillment");
  const locale = await getLocale();
  const { user } = await getUser();
  const { profile, services, plans, agreements } = await getSellerFulfillmentOverview(user!.id, {
    includeAgreements: true,
  });
  // No Tallaby plan is on offer while Tallaby services are "Soon": every
  // service in the form is the seller's.
  const formPlans = TALLABY_SERVICES_ENABLED ? plans : [];
  // The request form starts from the seller's current request (requested_*),
  // or from today's setup when they never asked for anything (P8-01).
  const initialRequest = initialRequestValues(formPlans, {
    model: profile?.model ?? null,
    operationalDetails: profile?.operationalDetails,
    pickupAddress: profile?.pickupAddress,
    services: services.map((row) => ({
      serviceType: row.serviceType,
      requestedProvider: row.requestedProvider,
      requestedPlanId: row.requestedPlanId,
      requestedConfig: (row.requestedConfig ?? {}) as ServiceConfig,
    })),
  });
  const plansById = new Map(plans.map((plan) => [plan.id, plan]));
  // Active terms first, then accepted, then proposed; newest first within each.
  const visibleAgreements = agreements
    .filter((a) => SELLER_VISIBLE_AGREEMENTS.includes(a.status))
    .sort(
      (a, b) =>
        SELLER_VISIBLE_AGREEMENTS.indexOf(a.status) - SELLER_VISIBLE_AGREEMENTS.indexOf(b.status)
    );

  const describe = (provider: FulfillmentProvider, planId: string | null, config: ServiceConfig) => {
    const who = t(`provider.${provider}`);
    const plan = planId ? plansById.get(planId) : undefined;
    if (plan) return `${who} — ${localizedPlanName(plan, locale)}`;
    if (config.mode === "own_riders") return `${who} — ${t("ownRiders")}`;
    if (config.mode === "external_courier") {
      return `${who} — ${config.courierName || t("externalCourier")}`;
    }
    return who;
  };

  const hasPending = services.some(
    (row) => row.status !== "active" && row.status !== "rejected"
  );

  return (
    <PageContainer narrow>
      <PageHeader title={t("title")} description={t("description")} />

      {services.length === 0 ? (
        <Note icon={Info}>{t("noSetup")}</Note>
      ) : (
        <>
          {hasPending && (
            <Note icon={Clock}>{t("pendingNotice")}</Note>
          )}

          <div className="flex flex-col gap-4">
            {FULFILLMENT_SERVICE_TYPES.map((type) => {
              const row = services.find((s) => s.serviceType === type);
              if (!row) return null;
              const activeConfig = (row.activeConfig ?? {}) as ServiceConfig;
              const requestedConfig = (row.requestedConfig ?? {}) as ServiceConfig;
              const requestDiffers = !choiceMatchesService(
                { provider: row.requestedProvider, planId: row.requestedPlanId, config: requestedConfig },
                { provider: row.activeProvider, planId: row.activePlanId, config: activeConfig }
              );
              const showRequest = requestDiffers && row.status !== "rejected";
              const requestedPlan = row.requestedPlanId ? plansById.get(row.requestedPlanId) : undefined;
              const serviceAgreements = visibleAgreements.filter((a) => a.serviceType === type);

              return (
                <SectionCard
                  key={type}
                  title={t(`service.${type}`)}
                  description={`${t("current")}: ${describe(row.activeProvider, row.activePlanId, activeConfig)}`}
                  action={
                    <StatusBadge tone={STATUS_TONES[showRequest && row.status === "requested" ? "requested" : row.status]}>
                      {showRequest && row.status === "requested" ? t("awaitingSetup") : t(`status.${row.status}`)}
                    </StatusBadge>
                  }
                >
                  {(showRequest || serviceAgreements.length > 0) && (
                    <div className="flex flex-col gap-3">
                      {showRequest && (
                        <div className="rounded-[14px] bg-(--s-tint) p-3 text-[13px] text-(--s-body)">
                          <span className="text-(--s-subtle)">{t("requested")}: </span>
                          {describe(row.requestedProvider, row.requestedPlanId, requestedConfig)}
                          {requestedPlan && <PlanPrice plan={requestedPlan} locale={locale} fallback={t("pricingDiscussed")} />}
                        </div>
                      )}
                      {serviceAgreements.map((agreement) => (
                        <AgreementCard
                          key={agreement.id}
                          agreement={agreement}
                          planName={
                            agreement.planId && plansById.get(agreement.planId)
                              ? localizedPlanName(plansById.get(agreement.planId)!, locale)
                              : null
                          }
                          t={t}
                          locale={locale}
                        />
                      ))}
                    </div>
                  )}
                </SectionCard>
              );
            })}
          </div>

          <p className="text-[13px] text-(--s-muted)">{t("changeNote")}</p>
        </>
      )}

      <FulfillmentRequestForm plans={formPlans} initial={initialRequest} hasRequest={services.length > 0} />
    </PageContainer>
  );
}

function PlanPrice({
  plan,
  locale,
  fallback,
}: {
  plan: FulfillmentPlanView;
  locale: string;
  fallback: string;
}) {
  return (
    <p className="mt-1 text-xs text-(--s-subtle)">
      {getPlanPricingLabel(plan.pricing, locale) ?? fallback}
    </p>
  );
}

type Translate = Awaited<ReturnType<typeof getTranslations<"fulfillment">>>;

function AgreementCard({
  agreement,
  planName,
  t,
  locale,
}: {
  agreement: SellerFulfillmentAgreementRow;
  planName: string | null;
  t: Translate;
  locale: string;
}) {
  const rates = (agreement.rates ?? []) as AgreementRate[];
  const amount = (value: number) =>
    t("rateAmount", {
      amount: new Intl.NumberFormat(locale.startsWith("ar") ? "ar-EG" : "en-EG", {
        maximumFractionDigits: 2,
        numberingSystem: "latn",
      }).format(value),
    });
  const feeName = (rate: AgreementRate) =>
    rate.feeType === "other" && rate.label?.trim()
      ? rate.label.trim()
      : t.has(`fee.${rate.feeType}`)
        ? t(`fee.${rate.feeType}`)
        : rate.feeType;
  const period = (unit: string | null | undefined) =>
    unit && t.has(`period.${unit}`) ? ` / ${t(`period.${unit}`)}` : "";

  return (
    <div className="rounded-2xl border border-(--s-line) p-3 text-[13px] text-(--s-body)">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-medium">
          <FileText className="size-4 text-(--s-subtle)" aria-hidden />
          {t("agreementTitle")}
          {planName && <span className="font-normal text-(--s-subtle)">· {planName}</span>}
        </span>
        <Tag tone={AGREEMENT_TONES[agreement.status]}>{t(`agreementStatus.${agreement.status as "active" | "accepted" | "proposed"}`)}</Tag>
      </div>
      {rates.length === 0 ? (
        <p className="text-(--s-subtle)">{t("noRates")}</p>
      ) : (
        <ul className="space-y-1">
          {rates.map((rate, index) => (
            <li key={index} className="flex flex-wrap justify-between gap-2">
              <span>{feeName(rate)}</span>
              <span className="font-medium tabular-nums">
                {amount(rate.amount)}
                {period(rate.unit)}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 flex items-center gap-1.5 text-xs text-(--s-subtle)">
        <CalendarRange className="size-3.5" />
        {agreement.effectiveFrom ?? t("notStarted")} → {agreement.effectiveTo ?? t("openEnded")}
      </p>
    </div>
  );
}
