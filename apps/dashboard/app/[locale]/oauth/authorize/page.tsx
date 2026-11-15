import type { Metadata } from "next";
import Image from "next/image";
// The consent check's redirect goes to the AI client's own redirect_uri (another site).
// eslint-disable-next-line no-restricted-imports -- external URL, never locale-prefixed
import { redirect as redirectExternal } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { initialConsentScopes, parseScopeParam, redirectDisplayHost } from "@workspace/lib/agents";
import { LanguageSwitcher } from "@/components/layout/language-switcher.client";
import { checkConsentRequest } from "./authorize.server";
import { ConsentForm } from "./authorize.client";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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

  if (check.kind === "signin") {
    redirect({ href: `/login?next=${encodeURIComponent(`/oauth/authorize?${query}`)}`, locale: await getLocale() });
  }
  if (check.kind === "redirect") redirectExternal(check.to);

  const t = await getTranslations("agentConsent");

  return (
    <div data-clarity-mask="true" className="flex min-h-screen flex-col items-center bg-muted/40 px-4 py-6 sm:py-10">
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
