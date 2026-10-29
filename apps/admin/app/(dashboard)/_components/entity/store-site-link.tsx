import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import { storeHostname, storeUrl } from "@workspace/lib/storefront";
import { storeHref } from "./entity-href.lib";

const SITE_LABELS: Record<string, string> = {
  published: "Website published",
  draft: "Website not published yet",
  unpublished: "Website switched off",
};

/** Green when the store's website is live; grey for draft or unpublished. */
export function SiteStatusDot({ status, className }: { status: string; className?: string }) {
  const label = SITE_LABELS[status] ?? `Website ${status}`;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        status === "published"
          ? "bg-green-500 ring-2 ring-green-500/20"
          : "bg-muted-foreground/40",
        className,
      )}
    />
  );
}

interface StoreSiteLinkProps {
  store: { id: string; name: string; subdomain: string; siteStatus: string };
  /** Active custom domain, if any. */
  domain?: string | null;
  /** Show the storefront host under the name. */
  showHost?: boolean;
  /** The store's industry, shown in gray after the name, e.g. "(Fashion)". */
  industry?: string | null;
}

/** Store name (to the admin store page) with its website status and storefront link. */
export function StoreSiteLink({ store, domain, showHost = true, industry }: StoreSiteLinkProps) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <SiteStatusDot status={store.siteStatus} />
        <Link
          href={storeHref(store.id)}
          className="max-w-48 truncate font-medium hover:underline"
          title={store.name}
        >
          {store.name}
        </Link>
        {industry && (
          <span className="max-w-32 shrink-0 truncate text-xs text-muted-foreground" title={industry}>
            ({industry})
          </span>
        )}
      </div>
      {showHost && (
        <a
          href={storeUrl(store.subdomain, domain)}
          target="_blank"
          rel="noopener noreferrer"
          dir="ltr"
          title="Open the storefront in a new tab"
          className="ms-4 inline-flex max-w-52 items-center gap-1 truncate text-xs text-muted-foreground hover:text-primary hover:underline"
        >
          {storeHostname(store.subdomain, domain)}
          <ExternalLink className="size-3 shrink-0" aria-hidden />
        </a>
      )}
    </div>
  );
}
