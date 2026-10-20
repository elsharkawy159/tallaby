import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { logServerError } from "@workspace/db/log";
import { ADMIN_AUDIT_ACTIONS, firstParam, pageCount, parseAdminListParams, pickEnum } from "@workspace/lib/admin";
import { AUDIT_SORT_IDS, listAdminAuditForAdmin, type AdminAuditListInput } from "@workspace/lib/admin/server";
import { getCurrentAdminUser } from "@/lib/auth/admin-auth";
import { AdminPager, buildHref } from "../_components/admin-pager";
import { AdminTable, type AdminTableColumn } from "../_components/admin-table/admin-table";
import { SORT_PARAM, parseSortParam } from "../_components/admin-table/admin-table.lib";
import { auditActionLabel, describeChange } from "../sellers/[id]/seller-admin.lib";
import { formatAdminDate } from "../stores/stores.lib";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const AUDIT_COLUMNS: AdminTableColumn[] = [
  { id: "createdAt", header: "When", sortable: true, descFirst: true },
  { id: "action", header: "Action", sortable: true },
  { id: "target", header: "Target", sortable: true },
  { id: "change", header: "Change" },
  { id: "reason", header: "Reason" },
  { id: "actor", header: "By", sortable: true },
];

/** Every audited admin change, newest first (docs/admin-saas.md §3.11). Read-only. */
export default async function AuditPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { q, page } = parseAdminListParams(params);
  const input: AdminAuditListInput = {
    q,
    page,
    action: pickEnum(params.action, ADMIN_AUDIT_ACTIONS),
    sellerId: firstParam(params.seller),
    scope: firstParam(params.scope) === "platform" ? "platform" : null,
    sort: parseSortParam(params[SORT_PARAM], AUDIT_SORT_IDS),
  };
  const sortParam = firstParam(params[SORT_PARAM]);
  const link = (next: Record<string, string | number | null>) =>
    buildHref("/audit", {
      q,
      action: input.action,
      seller: input.sellerId,
      scope: input.scope,
      sort: sortParam,
      page: null,
      ...next,
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Every admin change to a seller account, store, wallet, coupon, integration, domain, ad or template,
          with the reason given. Rows cannot be edited or deleted.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant={!input.scope ? "default" : "outline"}>
          <Link href={link({ scope: null })}>All</Link>
        </Button>
        <Button asChild size="sm" variant={input.scope === "platform" ? "default" : "outline"}>
          <Link href={link({ scope: "platform" })}>Platform only</Link>
        </Button>
        <form action="/audit" className="ml-auto flex flex-wrap gap-2">
          <select
            name="action"
            defaultValue={input.action ?? ""}
            className="h-8 rounded-md border bg-background px-2 text-sm"
            aria-label="Action"
          >
            <option value="">Any action</option>
            {ADMIN_AUDIT_ACTIONS.map((action) => (
              <option key={action} value={action}>
                {auditActionLabel(action)}
              </option>
            ))}
          </select>
          {input.scope && <input type="hidden" name="scope" value={input.scope} />}
          {input.sellerId && <input type="hidden" name="seller" value={input.sellerId} />}
          {sortParam && <input type="hidden" name="sort" value={sortParam} />}
          <Input name="q" defaultValue={q ?? ""} placeholder="Reason, seller or admin" className="h-8 w-56" />
          <Button type="submit" size="sm" variant="outline">
            Filter
          </Button>
        </form>
      </div>
      <Suspense key={JSON.stringify(input)} fallback={<Skeleton className="h-64 w-full" />}>
        <AuditTable input={input} link={link} />
      </Suspense>
    </div>
  );
}

async function AuditTable({
  input,
  link,
}: {
  input: AdminAuditListInput;
  link: (next: Record<string, string | number | null>) => string;
}) {
  await getCurrentAdminUser();
  let data: Awaited<ReturnType<typeof listAdminAuditForAdmin>>;
  try {
    data = await listAdminAuditForAdmin(input);
  } catch (error) {
    logServerError("admin", "audit list failed", {}, error);
    return <p className="text-sm text-destructive">The audit log could not be loaded. Try again.</p>;
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{data.total.toLocaleString()} entries</CardTitle>
      </CardHeader>
      <CardContent>
        <AdminTable
          sortMode="url"
          columns={AUDIT_COLUMNS}
          emptyMessage="No entries."
          rows={data.rows.map((row) => ({
            id: row.id,
            className: "align-top",
            cells: {
              createdAt: <span className="whitespace-nowrap text-xs text-muted-foreground">{formatAdminDate(row.createdAt)}</span>,
              action: (
                <Link href={link({ action: row.action })} className="text-sm font-medium hover:underline">
                  {auditActionLabel(row.action)}
                </Link>
              ),
              target: (
                <div className="text-sm">
                  {row.sellerId ? (
                    <>
                      <Link href={`/sellers/${row.sellerId}`} className="hover:underline">
                        {row.sellerName ?? "Seller"}
                      </Link>
                      {row.storeId && (
                        <div>
                          <Link href={`/stores/${row.storeId}`} className="text-xs text-muted-foreground hover:underline">
                            {row.storeName ?? "Store"}
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">
                      {row.targetType ?? "platform"}: {row.targetId ?? "—"}
                    </span>
                  )}
                </div>
              ),
              change: (
                <div className="max-w-72 text-xs text-muted-foreground">
                  {describeChange(row.before)} → {describeChange(row.after)}
                </div>
              ),
              reason: <div className="max-w-72 text-sm">{row.reason}</div>,
              actor: <span className="text-xs text-muted-foreground">{row.actorName ?? "—"}</span>,
            },
          }))}
        />
        <AdminPager page={input.page} pages={pageCount(data.total)} href={(p) => link({ page: p })} />
      </CardContent>
    </Card>
  );
}
