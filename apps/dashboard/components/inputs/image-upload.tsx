"use client";

import React, { useCallback, useState, useEffect } from "react";
import Image from "next/image";
import { X, LoaderCircle, Upload } from "lucide-react";
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

      if (successfulUploads.length > 0) {
        toast.success(
          `${successfulUploads.length} image(s) uploaded successfully`
        );
      }
    },
    [handleFileUpload, onChange, value, filesToUpload.length, maxImages]
  );

  const isMaxReached = filesToUpload.length >= maxImages;

  const { getRootProps, getInputProps } = useDropzone({
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
    <>
      <div className="flex-1">
        <label
          {...getRootProps()}
          className={`relative flex h-30 w-full flex-col items-center justify-center rounded-[8px] border-2 border-dashed py-6 transition-all ${
            isMaxReached
              ? "cursor-not-allowed border-gray-300 bg-gray-50 opacity-60"
              : "cursor-pointer border-primary bg-[#E3DEFF]/[.22] hover:bg-[#E3DEFF]/[.40]"
          }`}
        >
          <div className="space-y-2 text-center">
            <Upload
              className={`size-6 mb-3 mx-auto ${
                isMaxReached
                  ? "text-gray-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            />

            <p
              className={`text-sm font-semibold ${
                isMaxReached ? "text-gray-500" : "text-primary"
              }`}
            >
              {isMaxReached
                ? `Maximum ${maxImages} images reached`
                : "Click to upload or drag and drop"}
            </p>
            <p className="text-sm font-light text-foreground">
              PNG, JPG or WebP (MAX. 2MB)
            </p>
            <p className="text-xs text-gray-500 mt-2">
              {filesToUpload.length}/{maxImages} images uploaded
            </p>
          </div>
        </label>
        <Input
          {...getInputProps()}
          id="dropzone-file"
          accept="image/png, image/jpeg"
          type="file"
          className="hidden"
          disabled={isMaxReached}
        />
      </div>
      <div className="h-full flex mt-4 gap-4">
        {filesToUpload.length > 0 && (
          <div className="flex flex-col w-full max-w-24 gap-4">
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Droppable droppableId="images" direction="vertical">
                {(droppableProvided, droppableSnapshot) => (
                  <RadioGroup
                    defaultValue={
                      form.getValues("cover") ??
                      filesToUpload[0]?.liveSource ??
                      ""
                    }
                    className={`flex flex-col gap-4`}
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
                            className={`relative rounded-md border p-1 ${
                              snapshot.isDragging ? "bg-blue-50" : "bg-white"
                            }`}
                          >
                            <FilePreview
                              file={file}
                              removeFile={removeFile}
                              idx={idx}
                              bucket={bucket}
                            />
                            {/* {idx === 0 && (
                            <div className="absolute font-semibold text-white rounded-md w-full h-full bg-black/50 top-0 left-0 flex items-center justify-center">
                              PRIMARY
                            </div>
                          )} */}
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

        <div className="flex-1 h-full">
          {filesToUpload.length > 0 && (
            <div className="w-full h-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center p-4">
              <Image
                src={
                  filesToUpload[0].liveSource
                    ? getPublicUrl(filesToUpload[0].liveSource, bucket)
                    : filesToUpload[0].preview || ""
                }
                width={500}
                height={500}
                className="w-full h-auto object-contain rounded-lg shadow-lg"
                alt={`Selected image`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
          )}
        </div>
      </div>
    </>
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
        <AspectRatio
          ratio={4 / 3}
          className="relative overflow-hidden rounded-md"
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              fill
              className="object-cover transition-transform"
              alt={`Image ${idx + 1}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs text-gray-500">No image</span>
            </div>
          )}

          {/* Loading overlay for uploading images */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-center text-white">
                <LoaderCircle className="w-4 h-4 animate-spin mx-auto mb-1" />
                <span className="text-xs">Uploading...</span>
              </div>
            </div>
          )}

          {/* Primary image indicator */}
          {isPrimary && isUploaded && (
            <div className="absolute top-1 left-1 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
              Cover
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
            className="absolute top-1 right-1 hover:text-white size-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
            aria-label="Remove image"
          >
            <X size={10} />
          </Button>

          {/* Upload status indicator */}
          <div className="absolute bottom-1 right-1">
            {isUploaded && (
              <div
                className="w-2 h-2 bg-green-500 rounded-full shadow-sm"
                title="Uploaded"
              />
            )}
            {isUploading && (
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-sm"
                title="Uploading"
              />
            )}
          </div>
        </AspectRatio>
      </div>
    );
  }
);

FilePreview.displayName = "FilePreview";
