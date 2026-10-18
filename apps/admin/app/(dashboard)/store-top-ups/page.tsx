import Link from "next/link";
import { cn } from "@workspace/ui/lib/utils";
import { getStoreTopUps } from "./store-top-ups.data";
import { StoreTopUpsList } from "./store-top-ups.client";

export const dynamic = "force-dynamic";

/** Manual store-wallet top-ups: review the receipt, then approve (credits the wallet) or reject. */
export default async function StoreTopUpsPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const view = (await searchParams).view === "reviewed" ? "reviewed" : "pending";
  const rows = await getStoreTopUps(view);

  return (
    <div className="space-y-5">
      <nav className="flex gap-1.5" aria-label="Top-up views">
        {(["pending", "reviewed"] as const).map((v) => (
          <Link
            key={v}
            href={v === "pending" ? "/store-top-ups" : "/store-top-ups?view=reviewed"}
            aria-current={view === v ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm",
              view === v ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v === "pending" ? "Waiting for review" : "Reviewed (latest 100)"}
          </Link>
        ))}
      </nav>
      <StoreTopUpsList rows={rows} view={view} />
    </div>
  );
}
