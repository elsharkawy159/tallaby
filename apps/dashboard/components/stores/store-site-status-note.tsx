import { useTranslations } from "next-intl";
import { CircleOff, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shown next to a store's link when visitors cannot see the published site
 * (`stores.site_status`, apps/ecommerce/lib/storefront.server.ts):
 * - 'unpublished': the seller switched "Website live" off. Every storefront
 *   route shows the "store unavailable" page and checkout is refused.
 * - 'draft': never published. The storefront shows the basic default
 *   storefront (hero, categories, catalog) until the seller publishes.
 * Renders nothing for a published store. Works in server and client components.
 */
export function StoreSiteStatusNote({
  siteStatus,
  compact = false,
  className,
}: {
  siteStatus: string | null | undefined;
  /** One word for tight spots (the store switcher); the full sentence becomes the tooltip. */
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("storeSiteStatus");
  if (siteStatus !== "unpublished" && siteStatus !== "draft") return null;

  const offline = siteStatus === "unpublished";
  const Icon = offline ? CircleOff : Clock;
  const message = t(offline ? "offline" : "draft");

  return (
    <span
      role="note"
      title={compact ? message : undefined}
      className={cn(
        "inline-flex items-start gap-1 text-xs font-medium",
        offline ? "text-destructive" : "text-accent-ink",
        className,
      )}
    >
      <Icon className="mt-px size-3.5 shrink-0" aria-hidden />
      {compact ? (
        <>
          <span>{t(offline ? "offlineShort" : "draftShort")}</span>
          <span className="sr-only">{message}</span>
        </>
      ) : (
        <span>{message}</span>
      )}
    </span>
  );
}
