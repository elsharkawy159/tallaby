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
import { cn } from "@workspace/ui/lib/utils";
import { logServerError } from "@workspace/db/log";
import { DOMAIN_STATUSES, pageCount, parseAdminListParams, pickEnum } from "@workspace/lib/admin";
import { listDomainsForAdmin, type AdminDomainListInput } from "@workspace/lib/admin/server";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { AdminPager, buildHref } from "../_components/admin-pager";
import { ReasonActionButton } from "../_components/dialogs/reason-action.client";
import { formatAdminDate } from "../stores/stores.lib";
import { domainAdminAction } from "./domains.server";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const STATUS_CLASSES: Record<string, string> = {
  active: "bg-green-100 text-green-900 border-green-200",
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  failed: "bg-red-100 text-red-900 border-red-200",
};

/** Sellers' custom domains, failing ones first (docs/admin-saas.md §3.7). */
export default async function DomainsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { q, page } = parseAdminListParams(params);
  const input: AdminDomainListInput = { q, page, status: pickEnum(params.status, DOMAIN_STATUSES) };
  const link = (next: Record<string, string | number | null>) =>
    buildHref("/domains", { q, status: input.status, page: null, ...next });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Domains</h1>
        <p className="text-sm text-muted-foreground">
          Custom domains connected to seller stores. Re-check asks Vercel for the current DNS state.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant={!input.status ? "default" : "outline"}>
          <Link href={link({ status: null })}>All</Link>
        </Button>
        {DOMAIN_STATUSES.map((status) => (
          <Button key={status} asChild size="sm" variant={input.status === status ? "default" : "outline"} className="capitalize">
            <Link href={link({ status })}>{status}</Link>
          </Button>
        ))}
        <form action="/domains" className="ml-auto flex gap-2">
          {input.status && <input type="hidden" name="status" value={input.status} />}
          <Input name="q" defaultValue={q ?? ""} placeholder="Domain, store or seller" className="h-8 w-60" />
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>
      </div>
      <Suspense key={JSON.stringify(input)} fallback={<Skeleton className="h-64 w-full" />}>
        <DomainsTable input={input} link={link} />
      </Suspense>
    </div>
  );
}

async function DomainsTable({
  input,
  link,
}: {
  input: AdminDomainListInput;
  link: (next: Record<string, string | number | null>) => string;
}) {
  await getCurrentAdminUser();
  let data: Awaited<ReturnType<typeof listDomainsForAdmin>>;
  try {
    data = await listDomainsForAdmin(input);
  } catch (error) {
    logServerError("admin", "domain list failed", {}, error);
    return <p className="text-sm text-destructive">Domains could not be loaded. Try again.</p>;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {data.total.toLocaleString()} {data.total === 1 ? "domain" : "domains"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No domains.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domain</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last checked</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow key={row.id} className="align-top">
                  <TableCell className="font-medium" dir="ltr">
                    {row.domain}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.storeId ? (
                      <Link href={`/stores/${row.storeId}`} className="hover:underline">
                        {row.storeName}
                      </Link>
                    ) : (
                      "—"
                    )}
                    <div>
                      <Link href={`/sellers/${row.sellerId}`} className="text-xs text-muted-foreground hover:underline">
                        {row.sellerName ?? "Seller"}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("font-normal capitalize", STATUS_CLASSES[row.status])}>
                      {row.status}
                    </Badge>
                    {row.lastError && <p className="mt-1 text-xs text-destructive">{row.lastError}</p>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {formatAdminDate(row.lastCheckedAt)}
                    {row.verifiedAt && <div>verified {formatAdminDate(row.verifiedAt)}</div>}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <ReasonActionButton
                        label="Re-check"
                        title="Re-check"
                        reasonRequired={false}
                        payload={{ action: "recheck", domainId: row.id }}
                        action={domainAdminAction}
                      />
                      <ReasonActionButton
                        label="Remove"
                        title={`Remove ${row.domain}?`}
                        description="Detaches the domain from Tallaby. The store goes back to its tallaby.com subdomain. The seller can connect it again."
                        confirmLabel="Remove"
                        destructive
                        payload={{ action: "remove_domain", domainId: row.id }}
                        action={domainAdminAction}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <AdminPager page={input.page} pages={pageCount(data.total)} href={(p) => link({ page: p })} />
      </CardContent>
    </Card>
  );
}
