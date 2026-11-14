"use client";

import { useTranslations } from "next-intl";
import { LoaderCircle, Sparkles } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";

export type AiTranslateOffer = { untranslated: number; credits: number | null; cost: number };

/**
 * More › Fill missing translations, after the free template step: offers to
 * translate the rest with AI, saying what it costs first. "Templates only"
 * keeps what the templates filled and spends nothing.
 */
export function AiTranslateDialog({
  offer,
  running,
  onTranslate,
  onSkip,
}: {
  offer: AiTranslateOffer | null;
  running: boolean;
  onTranslate: () => void;
  onSkip: () => void;
}) {
  const t = useTranslations("storeEditor.fillTranslations");
  const outOfCredits = offer !== null && offer.credits !== null && offer.credits < offer.cost;
  return (
    <AlertDialog
      open={offer !== null}
      onOpenChange={(open) => {
        if (!open && !running) onSkip();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("aiTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("aiBody", { count: offer?.untranslated ?? 0 })}</AlertDialogDescription>
        </AlertDialogHeader>
        {offer && (
          <div className="space-y-2 text-sm">
            <p className="font-medium">
              {outOfCredits
                ? t("aiNoCredits")
                : offer.credits === null
                  ? t("aiCostFree")
                  : t("aiCost", { cost: offer.cost, credits: offer.credits })}
            </p>
            <p className="text-muted-foreground">{t("aiReview")}</p>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={running}>{t("templatesOnly")}</AlertDialogCancel>
          <Button onClick={onTranslate} disabled={running || outOfCredits}>
            {running ? <LoaderCircle className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
            {running ? t("aiRunning") : t("aiRun")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
