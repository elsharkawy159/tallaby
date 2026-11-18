"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { Modal, SellerButton } from "@/components/seller-ui";
import { cn } from "@/lib/utils";
import { TUTORIAL_VIDEOS, tutorialEmbedUrl, type TutorialVideoId } from "@/lib/tutorials/tutorial-videos";

/**
 * «كيف يعمل؟» next to the part of the dashboard a tutorial Short teaches
 * (ROADMAP.md F-97d). Opens the video in a dialog; it never autoplays and is
 * never muted, and the iframe only exists while the dialog is open, so closing
 * it stops the video.
 */
export function TutorialVideoButton({
  video,
  compact = false,
  className,
}: {
  video: TutorialVideoId;
  /** On phones (600px and below) show only the Play icon, for crowded bars. */
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("tutorialVideos");
  const [open, setOpen] = useState(false);
  const src = tutorialEmbedUrl(TUTORIAL_VIDEOS[video].youtubeId);
  if (!src) return null;
  const title = t(`titles.${video}`);

  return (
    <Modal
      open={open}
      onOpenChange={setOpen}
      width={380}
      title={title}
      trigger={
        <SellerButton
          variant="mini"
          size="xs"
          title={compact ? t("button") : undefined}
          className={cn("max-[600px]:h-9", compact && "max-[600px]:w-9 max-[600px]:px-0", className)}
        >
          <Play aria-hidden className="fill-current" />
          <span className={cn(compact && "max-[600px]:sr-only")}>{t("button")}</span>
        </SellerButton>
      }
    >
      {open && (
        <div className="mx-auto aspect-[9/16] w-full max-w-[calc(72dvh*9/16)] overflow-hidden rounded-2xl bg-black">
          <iframe
            src={src}
            title={title}
            className="size-full border-0"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      )}
    </Modal>
  );
}
