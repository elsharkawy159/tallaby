"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error("Shipping app error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="size-10 text-destructive" />
      <div>
        <h2 className="text-lg font-semibold">{t("somethingWrong")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || t("pageCouldNotLoad")}
        </p>
      </div>
      <Button onClick={reset}>{t("tryAgain")}</Button>
    </div>
  );
}
