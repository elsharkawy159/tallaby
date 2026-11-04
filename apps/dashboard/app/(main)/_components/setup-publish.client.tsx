"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { LoaderCircle, Lock } from "lucide-react";
import { SellerButton } from "@/components/seller-ui";
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
  next,
}: {
  storeId: string;
  /** A product and a chosen template are in place (publishReady). */
  ready: boolean;
  /** Why the button is locked (publishLockReason), shown as its tooltip. */
  lockedLabel?: string;
  /** It is the step to do now: the amber button. Otherwise the quiet one on the dark card. */
  next: boolean;
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
      {next && ready ? (
        <SellerButton size="sm" className={cn(!pending && "publish-attention")} disabled={pending} onClick={run}>
          {pending && <LoaderCircle className="animate-spin" aria-hidden />}
          {t("cta")}
        </SellerButton>
      ) : (
        <button
          type="button"
          disabled={!ready || pending}
          title={ready ? undefined : (lockedLabel ?? t("locked"))}
          onClick={run}
          className={cn(
            "inline-flex h-[34px] cursor-pointer items-center gap-1 whitespace-nowrap rounded-full border border-white/20 px-2.5 text-[12.5px] font-bold text-white transition-colors duration-150 hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-45 max-[600px]:h-10",
            ready && !pending && "publish-attention",
          )}
        >
          {pending ? (
            <LoaderCircle className="size-[15px] animate-spin" aria-hidden />
          ) : (
            !ready && <Lock className="size-[15px]" aria-hidden />
          )}
          {t("cta")}
        </button>
      )}

      <PublishCelebration live={live} onClose={close} />
    </>
  );
}
