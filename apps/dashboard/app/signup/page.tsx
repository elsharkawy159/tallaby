import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db, eq, sellers } from "@workspace/db";
import { createClient } from "@/supabase/server";
import { SignupForm } from "./signup.client";
import { cleanSubdomainPrefill, readSignupPrefillCookie } from "./signup-intent.server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signup");
  return { title: t("title"), robots: { index: false } };
}

const KNOWN_ERRORS = new Set(["subdomainTaken", "generic"]);

/**
 * Two-step seller signup (PLAN.md §6.1). Step 1, signed out: the account
 * (Google, or email + password). Step 2, signed in without a seller row
 * (after step 1, or an existing customer): the store (address, industry,
 * phone). Existing sellers go straight to the dashboard.
 */
export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; subdomain?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const [seller] = await db.select({ id: sellers.id }).from(sellers).where(eq(sellers.id, user.id)).limit(1);
    if (seller) redirect("/");
  }

  const { error, subdomain } = await searchParams;
  // Pre-filled from the marketing site's "claim your link" forms, carried over
  // step 1 by a cookie or the email signup's user_metadata; still checked live and on submit.
  const prefill =
    cleanSubdomainPrefill(subdomain) ??
    (user ? ((await readSignupPrefillCookie()) ?? cleanSubdomainPrefill(user.user_metadata?.signup_subdomain)) : null);
  return (
    <SignupForm
      // Remounts (fresh form and schema) when step 1 signs the user in.
      key={user ? "store" : "account"}
      signedInEmail={user ? (user.email ?? "") : null}
      initialError={error && KNOWN_ERRORS.has(error) ? (error as "subdomainTaken" | "generic") : null}
      initialSubdomain={prefill ?? ""}
    />
  );
}
