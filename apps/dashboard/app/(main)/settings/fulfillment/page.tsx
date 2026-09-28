import { CalendarRange, Clock, FileText, Info } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { getUser } from "@/actions/auth";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  FULFILLMENT_SERVICE_TYPES,
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

// Reads the signed-in seller's configuration from the session cookie.
export const dynamic = "force-dynamic";

/**
 * Agreement states a seller sees. Drafts are still being prepared internally;
 * superseded/terminated terms no longer apply. Admin notes are never shown.
 */
const SELLER_VISIBLE_AGREEMENTS: FulfillmentAgreementStatus[] = ["active", "accepted", "proposed"];

const AGREEMENT_STATUS_CLASSES: Partial<Record<FulfillmentAgreementStatus, string>> = {
  active: "bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-900/60",
  accepted: "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
  proposed: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
};

const STATUS_CLASSES: Record<FulfillmentServiceStatus, string> = {
  requested: "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
  under_review: "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
  awaiting_agreement: "bg-violet-50 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-900/60",
  active: "bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-900/60",
  paused: "bg-muted/50 text-foreground border-border",
  rejected: "bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60",
};

export default async function FulfillmentSetupPage() {
  const t = await getTranslations("fulfillment");
  const locale = await getLocale();
  const { user } = await getUser();
  const { services, plans, agreements } = await getSellerFulfillmentOverview(user!.id, {
    includeAgreements: true,
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
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      {services.length === 0 ? (
        <Alert>
          <Info className="size-4" />
          <AlertDescription>{t("noSetup")}</AlertDescription>
        </Alert>
      ) : (
        <>
          {hasPending && (
            <Alert>
              <Clock className="size-4" />
              <AlertDescription>{t("pendingNotice")}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4">
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
                <Card key={type}>
                  <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                    <div>
                      <CardTitle className="text-base">{t(`service.${type}`)}</CardTitle>
                      <CardDescription>
                        {t("current")}: {describe(row.activeProvider, row.activePlanId, activeConfig)}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={STATUS_CLASSES[showRequest && row.status === "requested" ? "requested" : row.status]}
                    >
                      {showRequest && row.status === "requested" ? t("awaitingSetup") : t(`status.${row.status}`)}
                    </Badge>
                  </CardHeader>
                  {(showRequest || serviceAgreements.length > 0) && (
                    <CardContent className="space-y-3 pt-0">
                      {showRequest && (
                        <div className="rounded-md bg-muted/50 p-3 text-sm">
                          <span className="text-muted-foreground">{t("requested")}: </span>
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
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          <p className="text-sm text-muted-foreground">{t("changeNote")}</p>
        </>
      )}
    </div>
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
    <p className="mt-1 text-xs text-muted-foreground">
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
    <div className="rounded-md border p-3 text-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-medium">
          <FileText className="size-4 text-muted-foreground" />
          {t("agreementTitle")}
          {planName && <span className="font-normal text-muted-foreground">· {planName}</span>}
        </span>
        <Badge variant="outline" className={AGREEMENT_STATUS_CLASSES[agreement.status]}>
          {t(`agreementStatus.${agreement.status as "active" | "accepted" | "proposed"}`)}
        </Badge>
      </div>
      {rates.length === 0 ? (
        <p className="text-muted-foreground">{t("noRates")}</p>
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
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <CalendarRange className="size-3.5" />
        {agreement.effectiveFrom ?? t("notStarted")} → {agreement.effectiveTo ?? t("openEnded")}
      </p>
    </div>
  );
}
