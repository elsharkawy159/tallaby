"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

/** Shares the store's own address, which is what sellers send customers. */
export function ShareStore({
  storeName,
  url,
  className,
}: {
  storeName: string;
  url: string;
  className?: string;
}) {
  const t = useTranslations("pages.stores");

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: storeName, url });
      } catch {
        // Dismissing the share sheet rejects; nothing to report.
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success(t("linkCopied"));
  };

  return (
    <button type="button" onClick={share} className={className}>
      <Share2 className="size-4" aria-hidden />
      {t("share")}
    </button>
  );
}
