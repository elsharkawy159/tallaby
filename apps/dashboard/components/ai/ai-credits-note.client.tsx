"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** At or under this, the note warns and offers more credits. */
const LOW_CREDITS = 10;

/**
 * Credits left, beside an AI button (ROADMAP.md F-57c). Shows nothing before the
 * USD switch or if the read fails: the server decides what's allowed, not this note.
 * Change `refreshKey` after an AI call to read the new number.
 */
export function AiCreditsNote({ refreshKey, className }: { refreshKey?: unknown; className?: string }) {
  const t = useTranslations("aiCredits");
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/ai/credits", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { live: boolean; total?: number } | null) => setTotal(data?.live ? (data.total ?? 0) : null))
      .catch(() => {});
    return () => controller.abort();
  }, [refreshKey]);

  if (total === null) return null;
  const low = total <= LOW_CREDITS;
  return (
    <p className={cn("text-xs text-muted-foreground", low && "text-destructive", className)}>
      {t("left", { count: total })}
      {low && (
        <>
          {" "}
          <Link href="/settings/plan" className="font-medium underline underline-offset-2">
            {t("buy")}
          </Link>
        </>
      )}
    </p>
  );
}
