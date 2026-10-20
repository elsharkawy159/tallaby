import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { logServerError } from "@workspace/db/log";
import {
  AD_REQUEST_STATUSES,
  firstParam,
  pageCount,
  parseAdminListParams,
  pickEnum,
} from "@workspace/lib/admin";
import { listAdRequestsForAdmin, type AdminAdListInput } from "@workspace/lib/admin/server";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { AdminPager, buildHref } from "../_components/admin-pager";
import { AD_STATUS_LABELS, AdRequestsTable } from "./ad-requests-table";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Sellers' paid product ads (docs/admin-saas.md §3.8). Pending requests sort first. */
export default async function AdRequestsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { q, page } = parseAdminListParams(params);
  const input: AdminAdListInput = {
    q,
    page,
    status: pickEnum(params.status, AD_REQUEST_STATUSES),
    sellerId: firstParam(params.seller),
  };
  const link = (next: Record<string, string | number | null>) =>
    buildHref("/ad-requests", { q, status: input.status, seller: input.sellerId, page: null, ...next });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ad campaigns</h1>
        <p className="text-sm text-muted-foreground">
          Product ads sellers bought from their dashboard. Check the payment, then approve, run and complete
          them. Rejecting a wallet-paid request refunds the store wallet.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant={!input.status ? "default" : "outline"}>
          <Link href={link({ status: null })}>All</Link>
        </Button>
        {AD_REQUEST_STATUSES.map((status) => (
          <Button key={status} asChild size="sm" variant={input.status === status ? "default" : "outline"}>
            <Link href={link({ status })}>{AD_STATUS_LABELS[status]}</Link>
          </Button>
        ))}
        <form action="/ad-requests" className="ml-auto flex gap-2">
          {input.status && <input type="hidden" name="status" value={input.status} />}
          <Input name="q" defaultValue={q ?? ""} placeholder="Seller, phone or transfer ref." className="h-8 w-60" />
          <Button type="submit" size="sm" variant="outline">
            Search
          </Button>
        </form>
      </div>
      <Suspense key={JSON.stringify(input)} fallback={<Skeleton className="h-64 w-full" />}>
        <AdRequestsList input={input} link={link} />
      </Suspense>
    </div>
  );
}

async function AdRequestsList({
  input,
  link,
}: {
  input: AdminAdListInput;
  link: (next: Record<string, string | number | null>) => string;
}) {
  await getCurrentAdminUser();
  let data: Awaited<ReturnType<typeof listAdRequestsForAdmin>>;
  try {
    data = await listAdRequestsForAdmin(input);
  } catch (error) {
    logServerError("admin", "ad request list failed", {}, error);
    return <p className="py-10 text-center text-sm text-destructive">Ad requests could not be loaded. Try again.</p>;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {data.total.toLocaleString()} {data.total === 1 ? "request" : "requests"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <AdRequestsTable rows={data.rows} />
        <AdminPager page={input.page} pages={pageCount(data.total)} href={(p) => link({ page: p })} />
      </CardContent>
    </Card>
  );
}
