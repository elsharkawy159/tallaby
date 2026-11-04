"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { cn } from "@/lib/utils";

// Renders only when the browser offers installation (Chromium/Edge/Android).
// iOS Safari never fires `beforeinstallprompt`; users install via Share →
// Add to Home Screen, which the manifest + appleWebApp metadata support.
export function InstallAppButton({ row = false }: { row?: boolean }) {
  const t = useTranslations("header");
  const { isInstallable, install } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <button
      type="button"
      onClick={install}
      aria-label={t("installApp")}
      title={t("installApp")}
      className={cn(
        "flex shrink-0 cursor-pointer items-center text-(--s-subtle) transition-colors duration-150 hover:bg-(--s-hover) hover:text-(--s-ink)",
        row ? "min-h-10 gap-[11px] rounded-xl px-3 text-[13px] font-medium text-(--s-muted)" : "size-9 justify-center rounded-[11px]",
      )}
    >
      <Download className="size-[18px] shrink-0" />
      {row && t("menuInstallApp")}
    </button>
  );
}
