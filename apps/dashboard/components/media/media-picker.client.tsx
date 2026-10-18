"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ImagePlus } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { MediaLibrary } from "./media-library.client";
import type { MediaAssetView } from "./media.dto";

/**
 * "Choose from library" button + dialog (PLAN.md P4-09): pick an existing
 * image of this store (or a shared one), or upload new ones and pick.
 * The library loads when the dialog opens.
 */
export function MediaPicker({
  storeId,
  onPick,
  disabled,
  readOnly = false,
}: {
  storeId: string;
  onPick: (asset: MediaAssetView) => void;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const t = useTranslations("mediaLibrary");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="sm" className="w-full" disabled={disabled} onClick={() => setOpen(true)}>
        <ImagePlus aria-hidden />
        {t("chooseFromLibrary")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{t("pickTitle")}</DialogTitle>
            <DialogDescription>{t("pickDescription")}</DialogDescription>
          </DialogHeader>
          {open && (
            <MediaLibrary
              storeId={storeId}
              mode="pick"
              readOnly={readOnly}
              onPick={(asset) => {
                onPick(asset);
                setOpen(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
