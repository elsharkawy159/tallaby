"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { PublishCelebration, type LiveSite } from "./publish-celebration.client";
import { requestSetupPromptCheck } from "./setup-prompts.lib";
import { isStoreLiveDialogBlocked, parseLiveSite, STORE_LIVE_EVENT, takeQueuedStoreLive } from "./store-live.lib";

/**
 * Mounted once in the (main) layout: shows "Your store is live!" when a page
 * announces that a store went live by itself (`announceStoreLive`), and tells
 * the setup prompts and the header's next step to look again (also for a
 * live site queued before a full page load). Not on the welcome page, which
 * shows its own live card.
 */
export function StoreLiveCelebration() {
  const pathname = usePathname() ?? "";
  const pathRef = useRef(pathname);
  const [live, setLive] = useState<LiveSite | null>(null);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const show = (site: LiveSite | null) => {
      if (!site) return;
      requestSetupPromptCheck();
      if (!isStoreLiveDialogBlocked(pathRef.current)) setLive(site);
    };
    const onLive = (event: Event) => show(parseLiveSite((event as CustomEvent<unknown>).detail));
    // A page that reloaded right after the store went live (the add-product form) queued it.
    show(takeQueuedStoreLive());
    window.addEventListener(STORE_LIVE_EVENT, onLive);
    return () => window.removeEventListener(STORE_LIVE_EVENT, onLive);
  }, []);

  return <PublishCelebration live={live} onClose={() => setLive(null)} />;
}
