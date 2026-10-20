"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { ImagePlus, ImageUp, LoaderCircle } from "lucide-react";
import { MEDIA_ACCEPT, MEDIA_MAX_BYTES } from "@workspace/lib/media";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";
import { useEditorAdapter } from "../adapter.client";
import { MediaLibrary } from "./media-library.client";
import { useMediaUpload } from "./use-media-upload.client";
import type { MediaAssetView } from "./media.dto";

/**
 * "Choose from library" button + dialog (PLAN.md P4-09): pick an existing
 * image of this store (or a shared one), or upload new ones and pick.
 * The library loads when the dialog opens. `open`/`onOpenChange` make it
 * controlled (the editor opens it from the canvas), `hideTrigger` drops the button.
 *
 * A host without a media library (`capabilities.mediaLibrary: false`, e.g.
 * admin section editing) gets an upload-only dialog instead: one image is
 * uploaded through the adapter and used right away; nothing is listed.
 */
export function MediaPicker({
  onPick,
  disabled,
  readOnly = false,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  onPick: (asset: MediaAssetView) => void;
  disabled?: boolean;
  readOnly?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const t = useTranslations("mediaLibrary");
  const uploadOnly = !useEditorAdapter().capabilities.mediaLibrary;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (value: boolean) => {
    setUncontrolledOpen(value);
    onOpenChange?.(value);
  };
  const pick = (asset: MediaAssetView) => {
    onPick(asset);
    setOpen(false);
  };
  return (
    <>
      {!hideTrigger && (
        <Button type="button" variant="outline" size="sm" className="w-full" disabled={disabled || (uploadOnly && readOnly)} onClick={() => setOpen(true)}>
          {uploadOnly ? <ImageUp aria-hidden /> : <ImagePlus aria-hidden />}
          {t(uploadOnly ? "uploadImage" : "chooseFromLibrary")}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn("max-h-[90dvh] overflow-y-auto", uploadOnly ? "sm:max-w-md" : "sm:max-w-4xl")}>
          <DialogHeader>
            <DialogTitle>{t(uploadOnly ? "uploadTitle" : "pickTitle")}</DialogTitle>
            <DialogDescription>{t(uploadOnly ? "uploadDescription" : "pickDescription")}</DialogDescription>
          </DialogHeader>
          {open && (uploadOnly ? <UploadOnly readOnly={readOnly} onPick={pick} /> : <MediaLibrary mode="pick" readOnly={readOnly} onPick={pick} />)}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Drop or choose one image; it is uploaded (adapter.media) and picked as soon as it is recorded. */
function UploadOnly({ readOnly, onPick }: { readOnly: boolean; onPick: (asset: MediaAssetView) => void }) {
  const t = useTranslations("mediaLibrary");
  const onUploaded = useCallback((asset: MediaAssetView) => onPick(asset), [onPick]);
  const { upload, items, isUploading } = useMediaUpload({ onUploaded });
  const failed = items.find((item) => item.status === "failed");
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept: MEDIA_ACCEPT,
    multiple: false,
    maxFiles: 1,
    noClick: true,
    disabled: readOnly || isUploading,
    onDrop: (accepted, rejected) => {
      if (rejected.length) toast.error(t(rejected.some((r) => r.file.size > MEDIA_MAX_BYTES) ? "errors.tooLarge" : "errors.invalidType"));
      if (accepted.length) void upload(accepted.slice(0, 1), { shared: false, folderId: null });
    },
  });
  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground",
        isDragActive && "border-primary bg-primary/5",
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? <LoaderCircle className="size-6 animate-spin" aria-hidden /> : <ImageUp className="size-6" aria-hidden />}
      <p>{isUploading ? t("uploading") : t("uploadDrop")}</p>
      <Button type="button" size="sm" variant="outline" onClick={open} disabled={readOnly || isUploading}>
        {t("uploadChoose")}
      </Button>
      {failed?.error && (
        <p role="alert" className="text-destructive">
          {t(`errors.${failed.error}`)}
        </p>
      )}
    </div>
  );
}
