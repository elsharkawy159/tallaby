"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";

/** Shares the store's own subdomain, e.g. https://faster.tallaby.com. */
export function ShareStoreButton({ storeName, url }: { storeName: string; url: string }) {
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
    <Button variant="outline" onClick={share} className="gap-2 rounded-full">
      <Share2 className="h-4 w-4" aria-hidden />
      {t("share")}
    </Button>
  );
}
