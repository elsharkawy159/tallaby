"use client";

import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Button } from "@workspace/ui/components";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function InstallAppButton() {
  const { isInstallable, install } = usePWAInstall();
  const t = useTranslations("installApp");
  const isIOS =
    typeof window !== "undefined" &&
    /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  if (!isInstallable && !isIOS) return null;

  return (
    <Button
      variant="outline"
      
      onClick={() => {
        if (isIOS) {
          toast.error(t("installAppError"));
        } else {
          install();
        }
      }}
    >
      {t("installApp")}
    </Button>
  );
}
