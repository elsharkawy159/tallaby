"use client";

import React, { useCallback, useState, useEffect } from "react";
import Image from "next/image";
import {
  X,
  LoaderCircle,
  Upload,
  ImageIcon,
  CheckCircle2,
  Trash,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd";
import { UseFormReturn } from "react-hook-form";

import { createClient } from "@/supabase/client";

import { Input } from "@workspace/ui/components/input";
import { AspectRatio } from "@workspace/ui/components/aspect-ratio";
import { RadioGroup } from "@workspace/ui/components/radio-group";
import {
  generateImageName,
  getPublicUrl,
  getTodayDate,
  validateImage,
} from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";

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
  bucket: string;
  maxImages?: number;
}

export function ImageUpload({
  onChange,
  value,
  form,
  bucket,
  maxImages = 5,
}: ImageUploadProps) {
  const supabase = createClient();

  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>(() =>
    value.map((file) => ({
      progress: 0,
      liveSource: file,
      isUploaded: true,
    }))
  );

  // Keep local state in sync when form value changes externally
  useEffect(() => {
    const hasInProgress = filesToUpload.some((f) => !f.isUploaded);
    if (hasInProgress) return;

    const currentLiveSources = filesToUpload
      .map((f) => f.liveSource)
      .filter((v): v is string => Boolean(v));

    const isSame =
      currentLiveSources.length === value.length &&
      currentLiveSources.every((v, i) => v === value[i]);

    if (isSame) return;

    setFilesToUpload(
      value.map((file) => ({
        progress: 0,
        liveSource: file,
        isUploaded: true,
      }))
    );
  }, [value]);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      filesToUpload.forEach((file) => {
        if (file.preview && file.preview.startsWith("blob:")) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const removeFile = useCallback(
    (fileToRemove: string) => {
      setFilesToUpload((prev) => {
        const filtered = prev.filter((item) => {
          const shouldRemove =
            item.liveSource === fileToRemove || item.preview === fileToRemove;

          // Clean up blob URL if it's a preview image being removed
          if (
            shouldRemove &&
            item.preview &&
            item.preview.startsWith("blob:")
          ) {
            URL.revokeObjectURL(item.preview);
          }

          return !shouldRemove;
        });

        return filtered;
      });

      // Only update the onChange value if it's an uploaded file (has liveSource)
      const updatedValue = value.filter((item) => item !== fileToRemove);
      if (updatedValue.length !== value.length) {
        onChange(updatedValue);
      }
    },
    [onChange, value]
  );

  const handleFileUpload = useCallback(
    async (file: File): Promise<string | null> => {
      const folderName = getTodayDate();
      const uniqueFileName = generateImageName(file);

      try {
        const { data, error } = await supabase.storage
          .from(bucket)
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
        toast.error(`An error occurred during upload of ${file.name}!`);
        return null;
      }
    },
    [supabase]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Check if adding new files would exceed max limit
      const currentCount = filesToUpload.length;
      const availableSlots = maxImages - currentCount;

      if (availableSlots <= 0) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      // Limit accepted files to available slots
      const filesToProcess = acceptedFiles.slice(0, availableSlots);
      const exceededFiles = acceptedFiles.slice(availableSlots);

      if (exceededFiles.length > 0) {
        toast.warning(
          `Only ${availableSlots} more image(s) allowed. ${exceededFiles.length} file(s) skipped.`
        );
      }

      const { validFiles, invalidFiles } = await Promise.all(
        filesToProcess.map(async (file) => {
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
              toast.error(
                error instanceof Error
                  ? error.message
                  : "An unknown error occurred"
              );
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
    [handleFileUpload, onChange, value, filesToUpload.length, maxImages]
  );

  const isMaxReached = filesToUpload.length >= maxImages;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
    },
    onDrop,
    disabled: isMaxReached,
    maxFiles: maxImages,
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
    <div className="flex lg:flex-row flex-col justify-between gap-4">
      {/* Image Preview */}
      {filesToUpload.length > 0 && (
        <div className="flex gap-6 flex-1">
          {/* Thumbnail Grid */}
          <div className="lg:col-span-1">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-700 flex justify-between items-center gap-2">
                <ImageIcon className="size-4" />

                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {filesToUpload.length}/{maxImages}
                </span>
              </h3>

              <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="images" direction="vertical">
                  {(droppableProvided) => (
                    <RadioGroup
                      defaultValue={
                        form.getValues("cover") ??
                        filesToUpload[0]?.liveSource ??
                        ""
                      }
                      className="flex flex-col gap-3"
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
                              className={`relative rounded-lg border min-w-28 transition-all duration-200 ${
                                snapshot.isDragging
                                  ? "bg-blue-50 border-blue-200 shadow-lg scale-105 rotate-2"
                                  : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md"
                              }`}
                            >
                              <FilePreview
                                file={file}
                                removeFile={removeFile}
                                idx={idx}
                                bucket={bucket}
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
          </div>

          {/* Preview Area */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {/* <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Preview
                {filesToUpload[0]?.isUploaded && (
                  <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Ready
                  </span>
                )}
              </h3> */}

              <div className="relative w-full h-[400px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {filesToUpload.length > 0 ? (
                  <div className="w-full h-full flex items-center justify-center p-2">
                    <Image
                      src={
                        filesToUpload[0].liveSource
                          ? getPublicUrl(filesToUpload[0].liveSource, bucket)
                          : filesToUpload[0].preview || ""
                      }
                      width={600}
                      height={600}
                      className="w-full h-full object-contain rounded-lg max-w-xl"
                      alt="Selected image preview"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImageIcon className="h-16 w-16 mb-4 opacity-50" />
                    <p className="text-sm font-medium">No image selected</p>
                    <p className="text-xs text-gray-400">
                      Choose an image from the gallery
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload */}
      <div className="relative flex-1">
        <label
          {...getRootProps()}
          className={`group bg-white relative flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200 ease-in-out ${
            isMaxReached
              ? "cursor-not-allowed border-gray-200 bg-gray-50/50 opacity-60"
              : isDragActive
                ? "cursor-pointer border-primary/60 bg-primary/5 scale-[1.02] shadow-lg"
                : "cursor-pointer border-gray-200 bg-gray-50/30 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
          }`}
        >
          <div className="space-y-4 text-center px-6 py-8">
            <div
              className={`relative transition-transform duration-200 ${isDragActive ? "scale-110" : "group-hover:scale-105"}`}
            >
              {isMaxReached ? (
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
              ) : (
                <Upload className="mx-auto h-12 w-12 text-gray-400 group-hover:text-primary transition-colors duration-200" />
              )}
            </div>

            <div className="space-y-2">
              <p
                className={`text-lg font-semibold transition-colors duration-200 ${
                  isMaxReached
                    ? "text-gray-500"
                    : isDragActive
                      ? "text-primary"
                      : "text-gray-700 group-hover:text-primary"
                }`}
              >
                {isMaxReached
                  ? `Maximum ${maxImages} images reached`
                  : isDragActive
                    ? "Drop images here"
                    : "Click to upload or drag and drop"}
              </p>

              <p className="text-sm text-gray-500 leading-relaxed">
                PNG, JPG or WebP (MAX. 2MB per file)
              </p>

              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span>Drag & drop</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span>Click to browse</span>
                </div>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <span className="font-medium">{filesToUpload.length}</span>
              <span>of</span>
              <span className="font-medium">{maxImages}</span>
              <span>images uploaded</span>
            </div>
          </div>

          {/* Subtle background pattern */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-transparent to-gray-50/20 pointer-events-none" />
        </label>

        <Input
          {...getInputProps()}
          id="dropzone-file"
          accept="image/png, image/jpeg, image/webp"
          type="file"
          className="hidden"
          disabled={isMaxReached}
        />
      </div>
    </div>
  );
}

interface FilePreviewProps {
  file: FileToUpload;
  removeFile: (file: string) => void;
  idx: number;
  bucket: string;
}

const FilePreview = React.memo(
  ({ file, removeFile, idx, bucket }: FilePreviewProps) => {
    // Determine the image source
    const getImageSrc = () => {
      if (file.liveSource) {
        return getPublicUrl(file.liveSource, bucket);
      } else if (file.preview) {
        return file.preview;
      }
      return "";
    };

    const imageSrc = getImageSrc();
    const isUploaded = file.isUploaded && file.liveSource;
    const isUploading = !file.isUploaded && file.preview;
    const isPrimary = idx === 0;

    return (
      <div className="relative group">
        <AspectRatio ratio={4 / 3} className="relative">
          {imageSrc ? (
            <Image
              src={imageSrc}
              fill
              className="object-cover transition-transform duration-300 hover:scale-105 hover:rotate-2 rounded-lg"
              alt={`Image ${idx + 1}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
          )}

          {/* Loading overlay for uploading images */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
              <div className="text-center text-white">
                <LoaderCircle className="w-6 h-6 animate-spin mx-auto mb-2" />
              </div>
            </div>
          )}

          {/* Primary image indicator */}
          {isPrimary && isUploaded && (
            <div className="absolute top-2 left-2 bg-primary ring-1 text-white text-[10px] px-1 py-0.5 rounded-full font-semibold shadow-sm">
              Main
            </div>
          )}

          {/* Remove button */}
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              const sourceToRemove = file.liveSource || file.preview;
              if (sourceToRemove) {
                removeFile(sourceToRemove);
              }
            }}
            className="absolute -top-1.5 -right-1.5 hover:text-white w-5.5 h-5.5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center lg:opacity-80 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-105"
            aria-label="Remove image"
          >
            <X className="size-3.5" />
          </Button>
        </AspectRatio>
      </div>
    );
  }
);

FilePreview.displayName = "FilePreview";
