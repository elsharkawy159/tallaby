"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { LIVE_VIEWS_TICK_MS, liveViewsBase, nextLiveViews } from "./live-views.lib";

/**
 * "N people are viewing this now", shown only when the seller ticked it on
 * the product. Drawn after mount (the number is random, so the server and
 * client renders would differ) and announced politely to screen readers
 * only once, not on every tick.
 */
export function LiveViews({ productId, className }: { productId: string; className?: string }) {
  const t = useTranslations("product");
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const base = liveViewsBase(productId);
    setCount(base);
    const timer = window.setInterval(() => setCount((current) => nextLiveViews(current ?? base, base, Math.random())), LIVE_VIEWS_TICK_MS);
    return () => window.clearInterval(timer);
  }, [productId]);

  if (count == null) return null;
  return (
    <p className={cn("inline-flex items-center gap-2 text-sm text-current", className)}>
      <span aria-hidden className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-60 motion-reduce:animate-none" />
        <span className="relative inline-flex size-2 rounded-full bg-red-500" />
      </span>
      <Eye className="size-4 opacity-70" aria-hidden />
      <span className="tabular-nums">{t("liveViews", { count })}</span>
    </p>
  );
}
