import { CircleCheck, Clock } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { redirect } from "@/i18n/navigation";
import { SELLER_DASHBOARD_URL } from "@/lib/seller/seller-cta.lib";
import { createClient } from "@/supabase/server";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { db, eq, sellers } from "@workspace/db";
import { FULFILLMENT_SERVICE_TYPES } from "@workspace/lib/fulfillment";
import { getSellerFulfillmentOverview } from "@workspace/lib/fulfillment/server";

// Reads the signed-in seller's setup from the session cookie.
export const dynamic = "force-dynamic";

export default async function OnboardingSuccessPage() {
  const locale = await getLocale();
  const t = await getTranslations("onboarding");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect({ href: "/auth?redirect=/onboarding", locale });

  const [seller] = await db
    .select({ id: sellers.id })
    .from(sellers)
    .where(eq(sellers.id, user!.id))
    .limit(1);
  if (!seller) redirect({ href: "/onboarding", locale });

  const { services } = await getSellerFulfillmentOverview(user!.id);
  const byType = new Map(services.map((row) => [row.serviceType, row]));
  const awaitingTallaby = services.some((row) => row.status !== "active" && row.status !== "rejected");

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <div className="absolute top-4 z-10 ltr:left-4 rtl:right-4">
        <LanguageSwitcher variant="default" />
      </div>
      <div className="mx-auto w-full max-w-xl space-y-6">
        <Logo color="primary" logoClassName="mx-auto" />
        <Card>
          <CardHeader className="items-center text-center">
            <CircleCheck className="mx-auto size-12 text-primary" aria-hidden />
            <CardTitle className="text-2xl">{t("success.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{t("success.body")}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-sm">
              {awaitingTallaby ? t("success.contactBody") : t("success.readyBody")}
            </p>
            {services.length > 0 && (
              <ul className="divide-y rounded-lg border">
                {FULFILLMENT_SERVICE_TYPES.map((type) => {
                  const row = byType.get(type);
                  if (!row) return null;
                  const pending = row.status !== "active";
                  return (
                    <li key={type} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span>{t(`service.${type}.name`)}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {t(`review.handledBy_${row.requestedProvider}`)}
                        </span>
                        {pending && (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="size-3" />
                            {t("review.awaitingSetup")}
                          </Badge>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href={SELLER_DASHBOARD_URL}>{t("success.goToDashboard")}</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <a href={`${SELLER_DASHBOARD_URL}settings/fulfillment`}>{t("success.viewSetupStatus")}</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
