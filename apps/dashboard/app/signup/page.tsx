import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { db, eq, sellers } from "@workspace/db";
import { createClient } from "@/supabase/server";
import { SignupForm } from "./signup.client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signup");
  return { title: t("title"), robots: { index: false } };
}

const KNOWN_ERRORS = new Set(["subdomainTaken", "generic"]);

/**
 * Minimal seller signup (PLAN.md §6.1). Signed-out visitors create an account
 * and a store; signed-in users without a seller row (e.g. customers) only
 * choose their store. Existing sellers go straight to the dashboard.
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
  return (
    <SignupForm
      signedInEmail={user ? (user.email ?? "") : null}
      initialError={error && KNOWN_ERRORS.has(error) ? (error as "subdomainTaken" | "generic") : null}
      // Pre-filled from the marketing site's "claim your link" forms; still checked live and on submit.
      initialSubdomain={typeof subdomain === "string" ? subdomain.trim().toLowerCase().slice(0, 32) : ""}
    />
  );
}
