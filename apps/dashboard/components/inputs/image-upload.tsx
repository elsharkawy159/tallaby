"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ImagePlus, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { createClient } from "@/supabase/client";
import { cn, generateImageName, getPublicUrl, validateImage } from "@/lib/utils";

interface FileToUpload {
  file?: File;
  preview?: string;
  liveSource: string | null;
  isUploaded: boolean;
}

interface ImageUploadProps {
  onChange: (value: string[]) => void;
  value: string[];
  /** Kept for call-site compatibility; uploads don't touch other fields. */
  form?: UseFormReturn<any>;
  bucket: string;
  maxImages?: number;
  /** Compact square layout for tight spaces (e.g. a table cell). */
  compact?: boolean;
  /** Left side of the footer row (format hints); the counter sits opposite. */
  footer?: React.ReactNode;
}

const keyOf = (file: FileToUpload) => file.liveSource || file.preview || "";

/**
 * Product image grid: the cover takes a 2×2 tile, the rest follow, and tiles
 * reorder by drag. Files upload to Supabase as soon as they're dropped.
 */
export function ImageUpload({
  onChange,
  value,
  bucket,
  maxImages = 5,
  compact = false,
  footer,
}: ImageUploadProps) {
  const supabase = createClient();
  const tToast = useTranslations("toast");
  const t = useTranslations("inputs.imageUpload");

  const [files, setFiles] = useState<FileToUpload[]>(() =>
    value.map((file) => ({ liveSource: file, isUploaded: true }))
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Keep local state in sync when the form value changes externally (import, draft restore).
  useEffect(() => {
    if (files.some((f) => !f.isUploaded)) return;
    const current = files.map((f) => f.liveSource).filter((v): v is string => Boolean(v));
    const isSame = current.length === value.length && current.every((v, i) => v === value[i]);
    if (!isSame) setFiles(value.map((file) => ({ liveSource: file, isUploaded: true })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Revoke blob previews on unmount.
  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview?.startsWith("blob:")) URL.revokeObjectURL(file.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeFile = useCallback(
    (source: string) => {
      setFiles((prev) =>
        prev.filter((item) => {
          const match = item.liveSource === source || item.preview === source;
          if (match && item.preview?.startsWith("blob:")) URL.revokeObjectURL(item.preview);
          return !match;
        })
      );
      const next = value.filter((item) => item !== source);
      if (next.length !== value.length) onChange(next);
    },
    [onChange, value]
  );

  const uploadFile = useCallback(
    async (file: File): Promise<string | null> => {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(generateImageName(file), file, { upsert: false });
        if (error) throw error;
        setFiles((prev) =>
          prev.map((item) =>
            item.file === file ? { ...item, liveSource: data.path, isUploaded: true } : item
          )
        );
        return data.path;
      } catch {
        setFiles((prev) => prev.filter((item) => item.file !== file));
        toast.error(tToast("uploadError", { fileName: file.name }));
        return null;
      }
    },
    [bucket, supabase, tToast]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const availableSlots = maxImages - files.length;
      if (availableSlots <= 0) {
        toast.error(tToast("maxImagesAllowed", { max: maxImages }));
        return;
      }

      const toProcess = acceptedFiles.slice(0, availableSlots);
      const skipped = acceptedFiles.length - toProcess.length;
      if (skipped > 0) {
        toast.warning(tToast("onlyMoreImagesAllowed", { available: availableSlots, skipped }));
      }

      const checked = await Promise.all(
        toProcess.map(async (file) => {
          try {
            await validateImage(file);
            return file;
          } catch (error) {
            toast.error(
              error instanceof Error
                ? tToast.has(error.message)
                  ? tToast(error.message)
                  : error.message
                : t("unknownError")
            );
            return null;
          }
        })
      );
      const validFiles = checked.filter((file): file is File => file !== null);
      if (validFiles.length === 0) return;

      setFiles((prev) => [
        ...prev,
        ...validFiles.map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          liveSource: null,
          isUploaded: false,
        })),
      ]);

      const uploaded = await Promise.all(validFiles.map(uploadFile));
      onChange([...value, ...uploaded.filter((path): path is string => path !== null)]);
    },
    [files.length, maxImages, onChange, t, tToast, uploadFile, value]
  );

  const isMaxReached = files.length >= maxImages;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/png": [], "image/jpeg": [], "image/webp": [] },
    onDrop,
    disabled: isMaxReached,
    maxFiles: maxImages,
    // Tile reordering uses native drag events too; don't treat those as file drops.
    noDragEventsBubbling: true,
  });

  const move = (from: number, to: number) => {
    if (from === to) return;
    const next = [...files];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    setFiles(next);
    onChange(next.map((f) => f.liveSource).filter((s): s is string => s !== null));
  };

  const tileDragProps = (index: number) => ({
    draggable: files[index]?.isUploaded,
    onDragStart: (e: React.DragEvent) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = "move";
    },
    onDragEnd: () => {
      setDragIndex(null);
      setOverIndex(null);
    },
    onDragOver: (e: React.DragEvent) => {
      if (dragIndex === null) return;
      e.preventDefault();
      setOverIndex(index);
    },
    onDragLeave: () => setOverIndex((current) => (current === index ? null : current)),
    onDrop: (e: React.DragEvent) => {
      if (dragIndex === null) return;
      e.preventDefault();
      move(dragIndex, index);
      setDragIndex(null);
      setOverIndex(null);
    },
  });

  const dropzone = (variant: "big" | "tile" | "compact") => (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] border-dashed border-input bg-muted text-center text-xs text-muted-foreground transition-colors",
        "hover:border-primary hover:bg-primary-soft hover:text-primary-ink",
        isDragActive && "border-primary bg-primary-soft text-primary-ink",
        variant === "big" && "col-span-full px-4 py-8",
        variant === "tile" && "aspect-square p-2",
        variant === "compact" && "size-16 rounded-lg"
      )}
    >
      <input {...getInputProps()} />
      {variant === "big" ? (
        <>
          <span className="mb-1 grid size-11 place-items-center rounded-xl border bg-card text-primary-ink">
            <ImagePlus className="size-[18px]" />
          </span>
          <b className="text-[15px] font-semibold text-foreground">
            {isDragActive ? t("dropHere") : t("dropTitle")}
          </b>
          <span>{t("dropSubtitle", { max: maxImages })}</span>
        </>
      ) : (
        <>
          <Plus className="size-[18px]" />
          {variant === "tile" && t("add")}
        </>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {files.map((file, index) => (
          <Tile
            key={keyOf(file)}
            file={file}
            bucket={bucket}
            compact
            isOver={overIndex === index}
            onRemove={removeFile}
            removeLabel={t("removeImage")}
            {...tileDragProps(index)}
          />
        ))}
        {!isMaxReached && dropzone("compact")}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
        {files.length === 0
          ? dropzone("big")
          : files.map((file, index) => (
              <Tile
                key={keyOf(file)}
                file={file}
                bucket={bucket}
                isCover={index === 0}
                coverLabel={t("cover")}
                isOver={overIndex === index}
                onRemove={removeFile}
                removeLabel={t("removeImage")}
                className={index === 0 ? "col-span-2 row-span-2" : undefined}
                {...tileDragProps(index)}
              />
            ))}
        {files.length > 0 && !isMaxReached && dropzone("tile")}
      </div>
      <div className="flex flex-wrap justify-between gap-3 text-xs text-muted-foreground">
        <span>{footer}</span>
        <span className="font-sans tabular-nums">
          {files.length} / {maxImages}
        </span>
      </div>
    </div>
  );
}

interface TileProps extends React.HTMLAttributes<HTMLDivElement> {
  file: FileToUpload;
  bucket: string;
  compact?: boolean;
  isCover?: boolean;
  coverLabel?: string;
  isOver: boolean;
  onRemove: (source: string) => void;
  removeLabel: string;
  draggable?: boolean;
}

function Tile({
  file,
  bucket,
  compact = false,
  isCover = false,
  coverLabel,
  isOver,
  onRemove,
  removeLabel,
  className,
  ...dragProps
}: TileProps) {
  const src = file.liveSource ? getPublicUrl(file.liveSource, bucket) : file.preview || "";
  const isUploading = !file.isUploaded;

  return (
    <div
      {...dragProps}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl border bg-muted",
        compact ? "size-16 rounded-lg" : "cursor-grab active:cursor-grabbing",
        isOver && "outline-2 outline-offset-2 outline-primary outline-dashed",
        className
      )}
    >
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" draggable={false} />
      )}

      {isUploading && (
        <div className="absolute inset-0 grid place-items-center bg-black/50">
          <LoaderCircle className="size-5 animate-spin text-white" />
        </div>
      )}

      {isCover && !isUploading && (
        <span className="absolute top-2 start-2 rounded-full bg-primary px-2 text-[11px] leading-[22px] font-semibold text-primary-foreground">
          {coverLabel}
        </span>
      )}

      {!isUploading && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const source = file.liveSource || file.preview;
            if (source) onRemove(source);
          }}
          aria-label={removeLabel}
          className={cn(
            "absolute top-1.5 end-1.5 grid place-items-center rounded-lg bg-black/55 text-white transition-opacity",
            compact ? "size-6" : "size-7",
            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
          )}
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}
