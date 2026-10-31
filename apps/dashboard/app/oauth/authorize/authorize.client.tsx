"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Bot, ShieldAlert } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Switch } from "@workspace/ui/components/switch";
import { AGENT_SCOPES, type AgentScope, DEFAULT_SCOPES, REQUIRED_SCOPE } from "@workspace/lib/agents/scopes";
import { approveAgentConsent, type ConsentStore, denyAgentConsent } from "./authorize.server";

type Props = {
  query: string;
  clientName: string;
  clientLogo: string | null;
  redirectHost: string;
  sellerName: string;
  stores: ConsentStore[];
  initialScopes: AgentScope[];
};

/** The seller's choices on the MCP consent page (ROADMAP.md F-29b). */
export function ConsentForm({ query, clientName, clientLogo, redirectHost, sellerName, stores, initialScopes }: Props) {
  const t = useTranslations("agentConsent");
  const [allStores, setAllStores] = useState(false);
  const [storeIds, setStoreIds] = useState<string[]>(stores.length === 1 ? [stores[0]!.id] : []);
  const [scopes, setScopes] = useState<AgentScope[]>(initialScopes);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggleStore = (id: string, on: boolean) =>
    setStoreIds((current) => (on ? [...new Set([...current, id])] : current.filter((s) => s !== id)));
  const toggleScope = (scope: AgentScope, on: boolean) =>
    setScopes((current) => (on ? [...new Set([...current, scope])] : current.filter((s) => s !== scope)));

  const decide = (approve: boolean) => {
    setError(null);
    if (approve && !allStores && storeIds.length === 0) {
      setError(t("pickStore"));
      return;
    }
    startTransition(async () => {
      const result = approve
        ? await approveAgentConsent({ query, allStores, storeIds, scopes })
        : await denyAgentConsent({ query });
      if (result.ok) {
        window.location.assign(result.redirectTo);
        return;
      }
      setError(result.error === "pickStore" ? t("pickStore") : t("failed"));
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {clientLogo ? (
            // eslint-disable-next-line @next/next/no-img-element -- third-party logo, not optimized on purpose
            <img src={clientLogo} alt="" className="size-full object-contain" referrerPolicy="no-referrer" />
          ) : (
            <Bot className="size-6 text-muted-foreground" aria-hidden />
          )}
        </div>
        <div className="min-w-0 space-y-1">
          <h1 className="text-lg font-semibold leading-snug break-words">{t("title", { client: clientName })}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle", { name: sellerName })}</p>
          <p className="text-xs text-muted-foreground" dir="auto">
            {t("redirectNote", { host: redirectHost })}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t("storesTitle")}</h2>
        {stores.length > 1 ? (
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3">
            <Checkbox checked={allStores} onCheckedChange={(v) => setAllStores(v === true)} />
            <span className="text-sm font-medium">{t("allStores")}</span>
          </label>
        ) : null}
        <div className="space-y-2">
          {stores.map((store) => (
            <label
              key={store.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-[:disabled]:opacity-60"
            >
              <Checkbox
                checked={allStores || storeIds.includes(store.id)}
                disabled={allStores}
                onCheckedChange={(v) => toggleStore(store.id, v === true)}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{store.name}</span>
                <span className="block truncate text-xs text-muted-foreground" dir="ltr">
                  {store.subdomain}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || "tallaby.com"}
                </span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{t("scopesTitle")}</h2>
        <div className="divide-y rounded-lg border">
          {AGENT_SCOPES.map((scope) => {
            const required = scope === REQUIRED_SCOPE;
            const sensitive = !DEFAULT_SCOPES.includes(scope);
            return (
              <label key={scope} className="flex cursor-pointer items-center justify-between gap-3 p-3">
                <span className="min-w-0">
                  <span className="block text-sm">{t(`scopes.${scope}`)}</span>
                  {required || sensitive ? (
                    <span className="block text-xs text-muted-foreground">{required ? t("required") : t("sensitive")}</span>
                  ) : null}
                </span>
                <Switch
                  checked={required || scopes.includes(scope)}
                  disabled={required}
                  onCheckedChange={(v) => toggleScope(scope, v)}
                />
              </label>
            );
          })}
        </div>
      </section>

      <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <ShieldAlert className="size-4 shrink-0" aria-hidden />
        {t("warning")}
      </p>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" disabled={pending} onClick={() => decide(false)}>
          {t("cancel")}
        </Button>
        <Button type="button" disabled={pending} onClick={() => decide(true)}>
          {pending ? t("allowing") : t("allow")}
        </Button>
      </div>
    </div>
  );
}
