import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { initialConsentScopes, parseScopeParam, redirectDisplayHost } from "@workspace/lib/agents";
import { LanguageSwitcher } from "@/components/layout/language-switcher.client";
import { checkConsentRequest } from "./authorize.server";
import { ConsentForm } from "./authorize.client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

function toQuery(params: Record<string, string | string[] | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") search.set(key, value);
    else if (Array.isArray(value) && value[0] !== undefined) search.set(key, value[0]);
  }
  return search.toString();
}

/**
 * MCP consent page (ROADMAP.md F-29b): an AI assistant (Claude, ChatGPT, …)
 * sends the seller here to approve access to chosen stores and scopes.
 */
export default async function AuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = toQuery(await searchParams);
  const check = await checkConsentRequest(query);

  if (check.kind === "signin") redirect(`/login?next=${encodeURIComponent(`/oauth/authorize?${query}`)}`);
  if (check.kind === "redirect") redirect(check.to);

  const t = await getTranslations("agentConsent");

  return (
    <div className="flex min-h-screen flex-col items-center bg-muted/40 px-4 py-6 sm:py-10">
      <div className="flex w-full max-w-lg items-center justify-between">
        <Image src="/logo/logo.png" alt="Tallaby" width={40} height={40} className="rounded-lg" />
        <LanguageSwitcher compact />
      </div>

      <main className="mt-6 w-full max-w-lg rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
        {check.kind === "problem" ? (
          <div className="space-y-4 text-center">
            <h1 className="text-lg font-semibold">{t("errors.title")}</h1>
            <p className="text-sm text-muted-foreground">{t(`errors.${check.problem}`)}</p>
            <Link href="/" className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
              {t("errors.back")}
            </Link>
          </div>
        ) : (
          <ConsentForm
            query={query}
            clientName={check.client.name}
            clientLogo={check.client.logoUrl}
            redirectHost={redirectDisplayHost(check.redirectUri)}
            sellerName={check.sellerName}
            stores={check.stores}
            initialScopes={initialConsentScopes(parseScopeParam(check.scope))}
          />
        )}
      </main>
    </div>
  );
}
