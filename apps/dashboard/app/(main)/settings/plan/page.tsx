import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Check, Gem, Minus, Store } from "lucide-react";
import { getPlanLimits, resolvePlanId, type PlanFeatures } from "@workspace/lib/plans";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Progress } from "@workspace/ui/components/progress";
import { SectionCard } from "@/components/form/form-ui";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";

const FEATURES: (keyof PlanFeatures)[] = ["customDomain", "ai", "advancedSettings", "removeTallabyBadge"];

/**
 * Plan & usage (PLAN.md §7.3, P3-05). Everyone is on Free for now; limits come
 * from the plans module (@workspace/lib/plans). No prices until paid plans exist.
 */
export default async function PlanPage() {
  const [seller, { stores, maxStores }, t] = await Promise.all([
    requireSeller(),
    getSellerStores(),
    getTranslations("planUsage"),
  ]);
  const planId = resolvePlanId(seller.plan);
  const limits = getPlanLimits(planId);
  const used = stores.length;

  return (
    <section className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
      <p className="text-sm text-muted-foreground">{t("description")}</p>

      <SectionCard
        id="plan"
        icon={Gem}
        title={t("currentPlan")}
        description={t("currentPlanDescription")}
        tag={<Badge variant="secondary">{t(`plans.${planId}`)}</Badge>}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-semibold">
              <Store className="size-4 text-muted-foreground" />
              {t("stores")}
            </span>
            <span className="tabular-nums text-muted-foreground">{t("storesUsage", { count: used, max: maxStores })}</span>
          </div>
          <Progress value={(used / Math.max(maxStores, 1)) * 100} className="h-1.5" />
          {used >= maxStores && <p className="text-xs text-muted-foreground">{t("storesFull")}</p>}
        </div>

        <ul className="divide-y rounded-xl border">
          {FEATURES.map((feature) => {
            const included = limits[feature];
            return (
              <li key={feature} className="flex items-center gap-3 px-4 py-3 text-sm">
                {included ? (
                  <Check className="size-4 shrink-0 text-success" aria-hidden />
                ) : (
                  <Minus className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                )}
                <span className="flex-1">{t(`features.${feature}`)}</span>
                <span className={included ? "text-xs text-success" : "text-xs text-muted-foreground"}>
                  {included ? t("included") : t("notOnPlan")}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/50 px-4 py-3 text-sm">
          <span className="text-muted-foreground">{t("upgradesSoon")}</span>
          <Button asChild variant="outline" size="sm">
            <Link href="/stores">{t("manageStores")}</Link>
          </Button>
        </div>
      </SectionCard>
    </section>
  );
}
