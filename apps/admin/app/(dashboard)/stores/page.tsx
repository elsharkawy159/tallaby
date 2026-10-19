import { Suspense } from "react";
import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { logServerError } from "@workspace/db/log";
import {
  SITE_STATUSES,
  STORE_STATUSES,
  firstParam,
  pageCount,
  parseAdminListParams,
  pickEnum,
} from "@workspace/lib/admin";
import { listStoreTemplateKeys, listStoresForAdmin, type AdminStoreListInput } from "@workspace/lib/admin/server";
import { storeHostname } from "@workspace/lib/storefront";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { AdminPager, buildHref } from "../_components/admin-pager";
import { SiteStatusBadge, StoreStatusBadge, formatAdminDate } from "./stores.lib";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Every store across all sellers (docs/admin-saas.md §3.3). */
export default async function StoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { q, page } = parseAdminListParams(params);
  const domainParam = firstParam(params.domain);
  const input: AdminStoreListInput = {
    q,
    page,
    status: pickEnum(params.status, STORE_STATUSES),
    siteStatus: pickEnum(params.site, SITE_STATUSES),
    hasDomain: domainParam === "yes" ? true : domainParam === "no" ? false : null,
    template: firstParam(params.template)?.slice(0, 64) ?? null,
    sellerId: firstParam(params.seller),
  };
  const keep = {
    q,
    status: input.status,
    site: input.siteStatus,
    domain: domainParam,
    template: input.template,
    seller: input.sellerId,
  };
  const link = (next: Record<string, string | number | null>) => buildHref("/stores", { ...keep, page: null, ...next });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Stores</h1>
        <p className="text-sm text-muted-foreground">
          Every seller store, its website, domain and catalog. Open a store for its pages, integrations,
          forms, content and audit trail.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Chip href={link({ site: null })} active={!input.siteStatus} label="Any site" />
          {SITE_STATUSES.map((value) => (
            <Chip key={value} href={link({ site: value })} active={input.siteStatus === value} label={`Site ${value}`} />
          ))}
          <span className="mx-1 w-px bg-border" />
          <Chip href={link({ status: null })} active={!input.status} label="Any status" />
          {STORE_STATUSES.map((value) => (
            <Chip key={value} href={link({ status: value })} active={input.status === value} label={value} />
          ))}
          <span className="mx-1 w-px bg-border" />
          <Chip href={link({ domain: null })} active={!domainParam} label="Any domain" />
          <Chip href={link({ domain: "yes" })} active={domainParam === "yes"} label="Custom domain" />
          <Chip href={link({ domain: "no" })} active={domainParam === "no"} label="Subdomain only" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Suspense fallback={null}>
            <TemplateFilter active={input.template} link={link} />
          </Suspense>
          <form action="/stores" className="ml-auto flex gap-2">
            {Object.entries(keep).map(([key, value]) =>
              key !== "q" && value ? <input key={key} type="hidden" name={key} value={value} /> : null,
            )}
            <Input name="q" defaultValue={q ?? ""} placeholder="Store, subdomain, seller or domain" className="h-8 w-64" />
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
          </form>
        </div>
      </div>

      <Suspense key={JSON.stringify(input)} fallback={<ListSkeleton />}>
        <StoresTable input={input} link={link} />
      </Suspense>
    </div>
  );
}

async function TemplateFilter({
  active,
  link,
}: {
  active: string | null;
  link: (next: Record<string, string | number | null>) => string;
}) {
  const keys = await listStoreTemplateKeys().catch(() => [] as string[]);
  if (keys.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <Chip href={link({ template: null })} active={!active} label="Any template" />
      {keys.map((key) => (
        <Chip key={key} href={link({ template: key })} active={active === key} label={key} />
      ))}
    </div>
  );
}

async function StoresTable({
  input,
  link,
}: {
  input: AdminStoreListInput;
  link: (next: Record<string, string | number | null>) => string;
}) {
  await getCurrentAdminUser();
  let data: Awaited<ReturnType<typeof listStoresForAdmin>>;
  try {
    data = await listStoresForAdmin(input);
  } catch (error) {
    logServerError("admin", "store directory failed", {}, error);
    return <p className="py-10 text-center text-sm text-destructive">Stores could not be loaded. Try again.</p>;
  }
  const { rows, total } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {total.toLocaleString()} {total === 1 ? "store" : "stores"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No stores match these filters.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Site</TableHead>
                <TableHead>Template</TableHead>
                <TableHead className="text-right">Products</TableHead>
                <TableHead>Last publish</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} className="relative">
                  <TableCell>
                    <Link href={`/stores/${row.id}`} className="font-medium after:absolute after:inset-0 hover:underline">
                      {row.name}
                    </Link>
                    <div className="flex gap-1 pt-0.5">
                      <StoreStatusBadge status={row.status} />
                      {row.isPrimary && <Badge variant="outline" className="font-normal">Primary</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <Link href={`/sellers/${row.sellerId}`} className="relative z-10 hover:underline">
                      {row.sellerName ?? "Seller"}
                    </Link>
                    <div className="text-xs text-muted-foreground">Plan: {row.plan}</div>
                  </TableCell>
                  <TableCell className="text-sm" dir="ltr">
                    {storeHostname(row.subdomain, row.domainStatus === "active" ? row.domain : null)}
                    {row.domain && row.domainStatus !== "active" && (
                      <div className="text-xs text-muted-foreground">
                        {row.domain} ({row.domainStatus})
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <SiteStatusBadge status={row.siteStatus} />
                  </TableCell>
                  <TableCell className="text-sm">{row.templateKey}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.productCount.toLocaleString()}
                    <div className="text-xs text-muted-foreground">{row.catalogMode === "selected" ? "selected" : "all"}</div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {formatAdminDate(row.lastPublishedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <AdminPager page={input.page} pages={pageCount(total)} href={(p) => link({ page: p })} />
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 py-6">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

function Chip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Button asChild size="sm" variant={active ? "default" : "outline"} className="capitalize">
      <Link href={href}>{label}</Link>
    </Button>
  );
}
