"use client";

import { Download } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { usePWAInstall } from "@/hooks/use-pwa-install";

// Renders only when the browser offers installation (Chromium/Edge/Android).
// iOS Safari never fires `beforeinstallprompt`; users install via Share →
// Add to Home Screen, which the manifest + appleWebApp metadata support.
export function InstallAppButton() {
  const { isInstallable, install } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9"
      onClick={install}
      aria-label="Install app"
      title="Install app"
    >
      <Download className="text-muted-foreground" />
    </Button>
  );
}
