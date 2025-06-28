"use client";

import React, { useCallback, useState, useMemo } from "react";
import Image from "next/image";
import { X, LoaderCircle } from "lucide-react";
import { useDropzone } from "react-dropzone";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import Swal from "sweetalert2";
import { UseFormReturn } from "react-hook-form";

import { createClient } from "@/supabase/client";
import { createSupabaseServerClient } from "@/supabase/server";

import { Input } from "@zaher/ui";
import { AspectRatio } from "@zaher/ui";
import { RadioGroup, RadioGroupItem } from "@zaher/ui";
import { Label } from "@zaher/ui";
import {
  generateImageName,
  getPublicUrl,
  getTodayDate,
  validateImage,
} from "@/lib/utils";
import { useTranslations } from "next-intl";
import { TFunction } from "@/types";

interface FileToUpload {
  progress: number;
  file?: File;
  preview?: string;
  liveSource: string | null;
  isUploaded: boolean;
}

interface ImageUploadProps {
  onChange: (value: string[]) => void;
  value: string[];
  form: UseFormReturn<any>;
}

export function ImageUpload({ onChange, value, form }: ImageUploadProps) {
  const t = useTranslations("formsChunk.upload");

  const supabase = createClient();

  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>(() =>
    value.map((file) => ({
      progress: 0,
      liveSource: file,
      isUploaded: true,
    }))
  );

  const removeFile = useCallback(
    (file: string) => {
      setFilesToUpload((prev) =>
        prev.filter((item) => item.liveSource !== file)
      );
      onChange(value.filter((item) => item !== file));
    },
    [onChange, value]
  );

  const handleFileUpload = useCallback(
    async (file: File): Promise<string | null> => {
      const folderName = getTodayDate();
      const uniqueFileName = generateImageName(file, folderName);

      try {
        const { data, error } = await supabase.storage
          .from("products")
          .upload(uniqueFileName, file, { upsert: false });

        if (error) throw error;

        setFilesToUpload((prev) =>
          prev.map((item) =>
            item.file?.name === file.name
              ? { ...item, liveSource: data.path, isUploaded: true }
              : item
          )
        );

        return data.path;
      } catch (error) {
        setFilesToUpload((prev) =>
          prev.filter((item) => item.file?.name !== file.name)
        );
        Swal.fire({
          title: "Error",
          text: `An error occurred during upload of ${file.name}!`,
          icon: "error",
        });
        return null;
      }
    },
    [supabase]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const { validFiles, invalidFiles } = await Promise.all(
        acceptedFiles.map(async (file) => {
          try {
            await validateImage(file);
            return { file, isValid: true };
          } catch (error) {
            return { file, isValid: false, error };
          }
        })
      ).then((results) =>
        results.reduce(
          (acc, { file, isValid, error }) => {
            if (isValid) {
              acc.validFiles.push(file);
            } else {
              acc.invalidFiles.push(file);
              Swal.fire({
                title: "Error",
                text:
                  error instanceof Error
                    ? error.message
                    : "An unknown error occurred",
                icon: "error",
              });
            }
            return acc;
          },
          { validFiles: [] as File[], invalidFiles: [] as File[] }
        )
      );

      if (validFiles.length === 0) return;

      const newFilesToUpload: FileToUpload[] = validFiles.map((file) => ({
        progress: 0,
        file,
        preview: URL.createObjectURL(file),
        liveSource: null,
        isUploaded: false,
      }));

      setFilesToUpload((prev) => [...prev, ...newFilesToUpload]);

      const uploadedPaths = await Promise.all(validFiles.map(handleFileUpload));
      const successfulUploads = uploadedPaths.filter(
        (path): path is string => path !== null
      );

      onChange([...value, ...successfulUploads]);
    },
    [handleFileUpload, onChange, value]
  );

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop,
  });

  const handleOnDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const items = Array.from(filesToUpload);
      const [reorderedItem] = items.splice(result.source.index, 1);

      if (reorderedItem && result.destination) {
        items.splice(result.destination.index, 0, reorderedItem);

        setFilesToUpload(items);
        onChange(
          items
            .map((item) => item.liveSource)
            .filter((source): source is string => source !== null)
        );
      }
    },
    [filesToUpload, onChange]
  );

  return (
    <div className="h-full">
      <label
        {...getRootProps()}
        className="relative flex h-96 w-full cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-primary bg-[#E3DEFF]/22 py-6 hover:bg-[#E3DEFF]/40"
      >
        <div className="space-y-2 text-center">
          <Image
            src="/icons/upload-cloud-icon.svg"
            width={58}
            height={58}
            className="mx-auto h-14 w-14"
            alt="upload cloud"
          />

          <p className="text-sm font-semibold text-primary">{t("drag")}</p>
          <p className="text-sm font-light text-foreground">
            {t("dragSubtitle")}
            <br />
            <span className="mt-3 block">{t("condition")}</span>
          </p>
        </div>
      </label>
      <Input
        {...getInputProps()}
        id="dropzone-file"
        accept="image/png, image/jpeg"
        type="file"
        className="hidden"
      />

      {filesToUpload.length > 0 && (
        <div className="mt-7">
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="images" direction="horizontal">
              {(droppableProvided, droppableSnapshot) => (
                <RadioGroup
                  defaultValue={
                    form.getValues("cover") ??
                    filesToUpload[0]?.liveSource ??
                    ""
                  }
                  className={`grid gap-4 md:grid-cols-3 lg:grid-cols-4 ${
                    droppableSnapshot.isDraggingOver ? "bg-blue-100" : ""
                  }`}
                  onValueChange={(cover) =>
                    form.setValue("attachments.cover", cover)
                  }
                  {...droppableProvided.droppableProps}
                  ref={droppableProvided.innerRef}
                >
                  {filesToUpload.map((file, idx) => (
                    <Draggable
                      key={file.liveSource || file.preview || ""}
                      draggableId={file.liveSource || file.preview || ""}
                      index={idx}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`relative rounded-md border p-2 ${
                            snapshot.isDragging ? "bg-blue-50" : "bg-white"
                          }`}
                        >
                          <FilePreview
                            file={file}
                            removeFile={removeFile}
                            idx={idx}
                            t={t}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {droppableProvided.placeholder}
                </RadioGroup>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
    </div>
  );
}

interface FilePreviewProps {
  file: FileToUpload;
  removeFile: (file: string) => void;
  idx: number;
  t: TFunction;
}

const FilePreview: React.FC<FilePreviewProps> = React.memo(
  ({ file, removeFile, idx, t }) => {
    if (file.liveSource) {
      return (
        <>
          <div className="relative">
            <AspectRatio ratio={4 / 3} className="relative">
              <Image
                src={getPublicUrl("products", file.liveSource)}
                fill
                className="object-cover"
                alt="preview image"
              />
            </AspectRatio>
            <button
              type="button"
              onClick={() => file.liveSource && removeFile(file.liveSource)}
              className="absolute -right-2 -top-2 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-[#FF357B] text-white transition-all group-hover:flex"
            >
              <X size={12} />
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2 space-x-2">
            <RadioGroupItem value={file.liveSource} id={`r1-${idx}`} />
            <Label htmlFor={`r1-${idx}`}>{t("defaultImage")}</Label>
          </div>
        </>
      );
    }

    return (
      <div>
        <AspectRatio ratio={4 / 3} className="relative">
          <Image
            src={file.preview || ""}
            fill
            className="object-cover"
            alt="preview image"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <LoaderCircle className="animate-spin" />
          </div>
        </AspectRatio>
      </div>
    );
  }
);

FilePreview.displayName = "FilePreview";
