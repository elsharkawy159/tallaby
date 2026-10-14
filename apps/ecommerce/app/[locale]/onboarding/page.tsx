import { redirect } from "@/i18n/navigation";
import { OAuth } from "@/components/auth/o-auth";
import { OnboardingFormClient } from "@/components/onboarding/onboarding-form.client";
import { createClient } from "@/supabase/server";
import { getLocale } from "next-intl/server";
import { db, eq, sellers } from "@workspace/db";
import { getOnboardingCatalog } from "@/components/onboarding/become-seller.server";
import type { Metadata } from "next";
import { generateNoIndexMetadata } from "@/lib/metadata";

// Account/onboarding screens are private (also disallowed in robots.ts).
export const metadata: Metadata = generateNoIndexMetadata();

// Reads the signed-in seller applicant from the session cookie.
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already a seller: show their setup status instead of a second application.
  if (user) {
    const [existing] = await db
      .select({ id: sellers.id })
      .from(sellers)
      .where(eq(sellers.id, user.id))
      .limit(1);
    if (existing) {
      redirect({ href: "/onboarding/success", locale: await getLocale() });
    }
  }

  const plans = user ? await getOnboardingCatalog() : [];

  return (
    <OnboardingFormClient
      user={user ? { id: user.id } : null}
      plans={plans}
      signInOptions={user ? undefined : <OAuth next={"/onboarding"} />}
    />
  );
}
