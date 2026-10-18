"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { previewLink } from "./editor.server";

/**
 * "Preview on my store" (PLAN.md P4-08), shared by the editor and the Website
 * overview. The tab is opened synchronously on click (so popup blockers allow
 * it) and pointed at the signed link once the server issues it.
 * `beforeOpen` lets the editor save pending changes first: the link is bound
 * to the drafts as they are when it is issued.
 */
export function useStorePreview(storeId: string, beforeOpen?: () => Promise<boolean>) {
  const t = useTranslations("storeEditor");
  const [opening, setOpening] = useState(false);

  const open = async () => {
    if (opening) return;
    setOpening(true);
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    try {
      if (beforeOpen && !(await beforeOpen())) {
        tab?.close();
        toast.error(t("errors.saveFirst"));
        return;
      }
      const result = await previewLink(storeId);
      if (!result.success) {
        tab?.close();
        toast.error(t(`errors.${result.error}`));
        return;
      }
      if (tab) tab.location.href = result.data.url;
      else window.location.href = result.data.url;
    } catch {
      tab?.close();
      toast.error(t("errors.generic"));
    } finally {
      setOpening(false);
    }
  };

  return { open, opening };
}
