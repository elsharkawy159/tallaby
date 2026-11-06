import Link from "next/link";
import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent } from "@workspace/ui/components/card";
import { cn } from "@workspace/ui/lib/utils";
import { listThemeRequestsForAdmin } from "@workspace/lib/admin/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";
import { FILTER_LABELS, FILTERS, formatWhen, parseFilter, STATUS_LABELS } from "./theme-requests.lib";

export const dynamic = "force-dynamic";

/**
 * Themes sellers asked for from Website › Templates (ROADMAP.md F-77, 0156).
 * A built theme ships in the code gallery for everyone; here the team tracks
 * each request, replies, and the seller is told by bell, push and email.
 */
export default async function ThemeRequestsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await validateAdminAccess("canManageUsers");
  const filter = parseFilter((await searchParams).status);
  const rows = await listThemeRequestsForAdmin(filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Theme requests</h1>
        <p className="text-sm text-muted-foreground">
          Themes sellers asked for from their Templates page. Build the theme into the code gallery (it ships with a
          deploy, for everyone), then mark it ready. In progress, ready and declined notify the seller; ready and
          declined also send an email.
        </p>
      </div>
      <nav className="flex flex-wrap gap-1.5" aria-label="Filter by status">
        {FILTERS.map((key) => (
          <Link
            key={key}
            href={key === "open" ? "/theme-requests" : `/theme-requests?status=${key}`}
            aria-current={filter === key ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm",
              filter === key ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {FILTER_LABELS[key]}
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">No requests here.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Link key={row.id} href={`/theme-requests/${row.id}`} className="block">
              <Card className="transition-colors hover:bg-muted/40">
                <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium">
                      <span className="truncate" dir="auto">
                        {row.description || row.referenceUrl || `${row.imageCount} image(s)`}
                      </span>
                      <Badge variant={row.status === "new" ? "default" : "outline"}>{STATUS_LABELS[row.status]}</Badge>
                    </p>
                    <p className="text-sm">
                      {row.storeName ?? row.subdomain ?? "No store"}
                      {row.sellerName ? ` · ${row.sellerName}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sent {formatWhen(row.createdAt)}
                      {row.imageCount > 0 ? ` · ${row.imageCount} image(s)` : ""}
                      {row.referenceUrl ? " · has a link" : ""}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
