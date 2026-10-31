"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackTallabyPageView } from "@workspace/lib/integrations";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Tallaby's own Meta Pixel on every dashboard page (/signup included):
 * PageView on the first load and on every client-side route change. The
 * shared helper loads it only on dashboard.tallaby.com (never localhost,
 * previews or staging) and loads Meta's base code once. See docs/meta-pixel.md.
 */
export function MetaPixel() {
  const pathname = usePathname();
  useEffect(() => {
    trackTallabyPageView(PIXEL_ID, pathname);
  }, [pathname]);
  return null;
}
