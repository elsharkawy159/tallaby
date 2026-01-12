import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { Separator } from "@workspace/ui/components";
import { OAuth } from "@/components/auth/o-auth";
import { OnboardingFormClient } from "@/components/onboarding/onboarding-form.client";
import { createClient } from "@/supabase/server";
import { getTranslations } from "next-intl/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const t = await getTranslations("onboarding");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="mx-auto w-full max-w-2xl">
        <Logo color="primary" />
        <h2 className="mt-4 text-2xl/9 font-bold tracking-tight text-gray-900 text-center">
          {t("becomeSeller")}
        </h2>
        <p className="mt-1 text-sm text-gray-600 text-center">
          {t("createVendorAccount")}{" "}
          {!user && (
            <Link
              href="/auth?redirect=/onboarding"
              className="font-semibold text-primary hover:text-primary/80"
            >
              {t("alreadyHaveAccount")}
            </Link>
          )}
        </p>
        <div className="mt-8">
          <Suspense fallback={<div>Loading...</div>}>
            <OnboardingFormClient user={user} />
          </Suspense>

          {!user && (
            <div className="space-y-4 mt-5">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t("orSignInWith")}
                  </span>
                </div>
              </div>
              <OAuth next={"/onboarding"} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
