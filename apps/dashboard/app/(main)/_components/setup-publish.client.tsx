"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { PublishCelebration, type LiveSite } from "./publish-celebration.client";
import { publishStoreFromHome } from "./setup-publish.server";

/**
 * The checklist's "Publish now" button. On success it shows the live address
 * over a confetti burst; the home page refreshes only when the dialog closes,
 * so the dialog survives the checklist hiding itself once every step is done.
 */
export function SetupPublishButton({
  storeId,
  ready,
  lockedLabel,
  variant,
}: {
  storeId: string;
  /** A product and a chosen template are in place (publishReady). */
  ready: boolean;
  /** Why the button is locked (publishLockReason), shown as its tooltip. */
  lockedLabel?: string;
  variant: "secondary" | "neutral";
}) {
  const t = useTranslations("home.setup.publish");
  const te = useTranslations("storeEditor");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [live, setLive] = useState<LiveSite | null>(null);

  const run = () =>
    startTransition(async () => {
      try {
        const result = await publishStoreFromHome(storeId);
        if (result.success) setLive({ url: result.url, hostname: result.hostname });
        else if (result.error === "templateNotChosen")
          toast.error(te("errors.templateNotChosen"), {
            action: { label: t("chooseTemplate"), onClick: () => router.push(`/stores/${storeId}/website/templates`) },
          });
        else toast.error(te(`errors.${result.error}` as "errors.generic"));
      } catch {
        toast.error(te("errors.generic"));
      }
    });

  const close = () => {
    setLive(null);
    router.refresh();
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={variant}
        className={cn("rounded-[9px]", ready && !pending && "publish-attention")}
        disabled={!ready || pending}
        title={ready ? undefined : (lockedLabel ?? t("locked"))}
        onClick={run}
      >
        {pending && <LoaderCircle className="animate-spin" aria-hidden />}
        {t("cta")}
      </Button>

      <PublishCelebration live={live} onClose={close} />
    </>
  );
}
