import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";
import { listAppRequestsForAdmin } from "@workspace/lib/admin/server";
import { validateAdminAccess } from "@/lib/auth/admin-auth";
import { AppRequestsList } from "./app-requests.client";

export const dynamic = "force-dynamic";

/** Apps sellers asked for (ROADMAP.md F-62). Enabling shows on the seller's card; sending SMS comes with F-38. */
export default async function AppRequestsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  await validateAdminAccess("canManageUsers");
  const view = (await searchParams).view === "reviewed" ? "reviewed" : "open";
  const rows = await listAppRequestsForAdmin(view);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">App requests</h1>
        <p className="text-sm text-muted-foreground">
          Apps sellers asked for from their Apps page. Enabling shows on the seller&apos;s card. SMS doesn&apos;t send
          until the SMS provider is connected.
        </p>
      </div>
      <nav className="flex gap-1.5" aria-label="Request views">
        {(["open", "reviewed"] as const).map((v) => (
          <Link
            key={v}
            href={v === "open" ? "/app-requests" : "/app-requests?view=reviewed"}
            aria-current={view === v ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm",
              view === v ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {v === "open" ? "Waiting" : "Reviewed (latest 100)"}
          </Link>
        ))}
      </nav>
      <AppRequestsList rows={rows} />
    </div>
  );
}
