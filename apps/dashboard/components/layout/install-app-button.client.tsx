"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { cn } from "@/lib/utils";

// Renders only when the browser offers installation (Chromium/Edge/Android).
// iOS Safari never fires `beforeinstallprompt`; users install via Share →
// Add to Home Screen, which the manifest + appleWebApp metadata support.
export function InstallAppButton({ className }: { className?: string }) {
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
        "flex size-9.5 shrink-0 items-center justify-center rounded-[10px] text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      <Download className="size-[18px]" />
    </button>
  );
}
