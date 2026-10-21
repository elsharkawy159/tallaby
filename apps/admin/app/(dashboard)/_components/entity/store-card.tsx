import Link from "next/link";
import { Star } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { SiteStatusBadge, StoreStatusBadge } from "../../stores/stores.lib";
import { EntityAvatar } from "./entity-avatar";
import { storeHref } from "./entity-href.lib";
import type { RelatedStore } from "./relations.server";

/** One store as a link tile: logo, name, address and whether the site is live. */
export function StoreCard({
  store,
  domain,
  className,
}: {
  store: Pick<RelatedStore, "id" | "name" | "subdomain" | "logoUrl" | "isPrimary" | "status" | "siteStatus">;
  /** The active custom domain, when known; otherwise the subdomain is shown. */
  domain?: string | null;
  className?: string;
}) {
  return (
    <Link
      href={storeHref(store.id)}
      className={cn(
        "group flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors",
        "hover:border-primary/40 hover:bg-primary-soft",
        "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className,
      )}
    >
      <EntityAvatar kind="store" name={store.name} src={store.logoUrl} seed={store.id} size="md" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate font-medium">
          <span className="truncate">{store.name}</span>
          {store.isPrimary ? (
            <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Primary store" />
          ) : null}
        </p>
        <p className="truncate text-xs text-muted-foreground" dir="ltr">
          {domain ?? store.subdomain}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <SiteStatusBadge status={store.siteStatus} />
        <StoreStatusBadge status={store.status} />
      </div>
    </Link>
  );
}
