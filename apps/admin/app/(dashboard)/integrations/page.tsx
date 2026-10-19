import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { logServerError } from "@workspace/db/log";
import { INTEGRATION_STATUSES, pageCount, parseAdminListParams, pickEnum } from "@workspace/lib/admin";
import { listIntegrationsForAdmin, type AdminIntegrationListInput } from "@workspace/lib/admin/server";
import { INTEGRATION_PROVIDERS } from "@workspace/lib/integrations";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { AdminPager, buildHref } from "../_components/admin-pager";
import { UrlTabs, pickTab } from "../_components/url-tabs";
import { PROVIDER_LABELS, formatAdminDate } from "../stores/stores.lib";
import { IntegrationsTable } from "./integrations-table";
import { getCachedIntegrationSummary } from "./integrations.data";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const TABS = ["overview", "connections", "errors"] as const;

/** Store apps across all sellers (docs/admin-saas.md §3.5). */
export default async function IntegrationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = pickTab(params.tab, TABS);
  await getCurrentAdminUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Tracking, export and import apps that sellers connected to their stores. Only public ids are shown;
          credentials stay encrypted.
        </p>
      </div>
      <UrlTabs
        baseHref="/integrations"
        active={tab}
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "connections", label: "Connections" },
          { key: "errors", label: "Errors" },
        ]}
      />
      {tab === "overview" ? (
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <Overview />
        </Suspense>
      ) : (
        <Connections params={params} errorsOnly={tab === "errors"} />
      )}
    </div>
  );
}

async function Overview() {
  let summary: Awaited<ReturnType<typeof getCachedIntegrationSummary>>;
  try {
    summary = await getCachedIntegrationSummary();
  } catch (error) {
    logServerError("integration", "admin summary failed", {}, error);
    return <p className="text-sm text-destructive">The summary could not be loaded. Try again.</p>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summary.map((row) => (
        <Card key={row.provider}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between gap-2 text-base">
              {PROVIDER_LABELS[row.provider] ?? row.provider}
              {row.availability === "soon" && <Badge variant="secondary">Soon</Badge>}
            </CardTitle>
            <p className="text-xs text-muted-foreground capitalize">{row.category}</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex gap-4 text-sm">
              <Link href={buildHref("/integrations", { tab: "connections", provider: row.provider, status: "connected" })} className="hover:underline">
                <span className="text-lg font-semibold tabular-nums">{row.connected}</span> connected
              </Link>
              <Link
                href={buildHref("/integrations", { tab: "errors", provider: row.provider })}
                className={row.error ? "text-destructive hover:underline" : "text-muted-foreground hover:underline"}
              >
                <span className="text-lg font-semibold tabular-nums">{row.error}</span> errors
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">
              {row.disconnected} disconnected
              {row.lastErrorAt ? ` · last error ${formatAdminDate(row.lastErrorAt)}` : ""}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Connections({
  params,
  errorsOnly,
}: {
  params: Record<string, string | string[] | undefined>;
  errorsOnly: boolean;
}) {
  const { q, page } = parseAdminListParams(params);
  const input: AdminIntegrationListInput = {
    q,
    page,
    provider: pickEnum(params.provider, INTEGRATION_PROVIDERS),
    status: errorsOnly ? "error" : pickEnum(params.status, INTEGRATION_STATUSES),
  };
  const tab = errorsOnly ? "errors" : "connections";
  const link = (next: Record<string, string | number | null>) =>
    buildHref("/integrations", { tab, q, provider: input.provider, status: errorsOnly ? null : input.status, page: null, ...next });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant={!input.provider ? "default" : "outline"}>
          <Link href={link({ provider: null })}>All apps</Link>
        </Button>
        {INTEGRATION_PROVIDERS.map((provider) => (
          <Button key={provider} asChild size="sm" variant={input.provider === provider ? "default" : "outline"}>
            <Link href={link({ provider })}>{PROVIDER_LABELS[provider] ?? provider}</Link>
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {!errorsOnly && (
          <>
            <Button asChild size="sm" variant={!input.status ? "default" : "outline"}>
              <Link href={link({ status: null })}>Any status</Link>
            </Button>
            {INTEGRATION_STATUSES.map((status) => (
              <Button key={status} asChild size="sm" variant={input.status === status ? "default" : "outline"} className="capitalize">
                <Link href={link({ status })}>{status}</Link>
              </Button>
            ))}
          </>
        )}
        <form action="/integrations" className="ml-auto flex gap-2">
          <input type="hidden" name="tab" value={tab} />
          {input.provider && <input type="hidden" name="provider" value={input.provider} />}
          {!errorsOnly && input.status && <input type="hidden" name="status" value={input.status} />}
          <Input name="q" defaultValue={q ?? ""} placeholder="Store, seller or account id" className="h-8 w-60" />
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>
      </div>
      <Suspense key={JSON.stringify(input)} fallback={<Skeleton className="h-64 w-full" />}>
        <ConnectionsTable input={input} link={link} />
      </Suspense>
    </div>
  );
}

async function ConnectionsTable({
  input,
  link,
}: {
  input: AdminIntegrationListInput;
  link: (next: Record<string, string | number | null>) => string;
}) {
  let data: Awaited<ReturnType<typeof listIntegrationsForAdmin>>;
  try {
    data = await listIntegrationsForAdmin(input);
  } catch (error) {
    logServerError("integration", "admin connection list failed", {}, error);
    return <p className="text-sm text-destructive">Integrations could not be loaded. Try again.</p>;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {data.total.toLocaleString()} {data.total === 1 ? "integration" : "integrations"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <IntegrationsTable rows={data.rows} showStore />
        <AdminPager page={input.page} pages={pageCount(data.total)} href={(p) => link({ page: p })} />
      </CardContent>
    </Card>
  );
}
