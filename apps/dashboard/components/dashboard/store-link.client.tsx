"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Share2, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { getStorefrontStoreUrl } from "@/lib/constants";

interface StoreLinkProps {
  slug: string;
  storeName?: string | null;
  isCollapsed?: boolean;
}

const ICON_BUTTON =
  "shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";

export const StoreLink = ({ slug, storeName, isCollapsed }: StoreLinkProps) => {
  const t = useTranslations("nav");
  const [copied, setCopied] = useState(false);
  const storeUrl = getStorefrontStoreUrl(slug);
  const displayUrl = storeUrl.replace(/^https?:\/\//, "");
  // Web Share support is only known in the browser; resolve after mount to
  // keep the server and client markup identical.
  const [canShare, setCanShare] = useState(false);
  useEffect(() => setCanShare("share" in navigator), []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast.success(t("storeLinkCopied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("storeLinkCopyFailed"));
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: storeName ?? undefined, url: storeUrl });
    } catch {
      // User dismissed the share sheet — nothing to do.
    }
  };

  if (isCollapsed) {
    return (
      <a
        href={storeUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={t("viewStore")}
        aria-label={t("viewStore")}
        className="flex items-center justify-center rounded-lg px-2 py-3 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      >
        <Store className="h-5 w-5" />
      </a>
    );
  }

  return (
    <div className="rounded-lg border border-sidebar-border bg-sidebar-accent/50 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Store className="h-3.5 w-3.5 shrink-0" />
        {t("myStore")}
      </div>
      <div className="flex items-center gap-1">
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={t("viewStore")}
          dir="ltr"
          className="min-w-0 flex-1 truncate text-sm font-medium text-sidebar-foreground hover:underline"
        >
          {displayUrl}
        </a>
        <button
          type="button"
          onClick={handleCopy}
          className={ICON_BUTTON}
          title={t("copyStoreLink")}
          aria-label={t("copyStoreLink")}
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
        {canShare && (
          <button
            type="button"
            onClick={handleShare}
            className={ICON_BUTTON}
            title={t("shareStore")}
            aria-label={t("shareStore")}
          >
            <Share2 className="h-4 w-4" />
          </button>
        )}
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={ICON_BUTTON}
          title={t("viewStore")}
          aria-label={t("viewStore")}
        >
          <ExternalLink className="h-4 w-4 rtl:-scale-x-100" />
        </a>
      </div>
    </div>
  );
};
