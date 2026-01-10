"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Star, Loader2, Image as ImageIcon, X, Upload, Video } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Textarea, Input, Checkbox } from "@workspace/ui/components";
import { createReview } from "@/actions/reviews";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/supabase/client";
import Image from "next/image";

interface OrderItemReviewFormProps {
  orderId: string;
  orderItemId: string;
  productId: string;
  sellerId: string;
  productName: string;
  productImage?: string;
  hasReview: boolean;
}

export function OrderItemReviewForm({
  orderId,
  orderItemId,
  productId,
  sellerId,
  productName,
  productImage,
  hasReview,
}: OrderItemReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [filePreviews, setFilePreviews] = useState<Array<{ url: string; type: 'image' | 'video'; path: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  if (hasReview) {
    return (
      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-800">
          ✓ You have already reviewed this product
        </p>
      </div>
    );
  }

  // Generate unique filename for uploads
  const generateFileName = (file: File): string => {
    const fileExt = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `reviews/${timestamp}-${randomStr}.${fileExt}`;
  };

  // Handle file upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check if adding new files would exceed max limit (5 files)
    if (uploadedFiles.length + files.length > 5) {
      toast.error("Maximum 5 files allowed per review");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setIsUploading(true);

    try {
      const filesToUpload = Array.from(files);
      const uploadPromises = filesToUpload.map(async (file) => {
        // Validate file type (images or videos)
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
          toast.error(`${file.name} is not a valid image or video file`);
          return null;
        }

        // Validate file size (10MB max for images, 50MB for videos)
        const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > maxSize) {
          toast.error(`${file.name} is too large. Max size: ${isImage ? '10MB' : '50MB'}`);
          return null;
        }

        // Generate unique filename
        const fileName = generateFileName(file);
        
        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from("products")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) {
          console.error("Upload error:", error);
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("products").getPublicUrl(fileName);

        return {
          path: fileName,
          url: publicUrl,
          type: isImage ? ("image" as const) : ("video" as const),
        };
      });

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter(
        (result): result is NonNullable<typeof result> => result !== null
      );

      if (successfulUploads.length > 0) {
        const newPaths = successfulUploads.map((u) => u.path);
        const newPreviews = successfulUploads.map((u) => ({
          url: u.url,
          type: u.type,
          path: u.path,
        }));

        setUploadedFiles((prev) => [...prev, ...newPaths]);
        setFilePreviews((prev) => [...prev, ...newPreviews]);
        toast.success(`${successfulUploads.length} file(s) uploaded successfully`);
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Remove uploaded file
  const handleRemoveFile = (index: number) => {
    const fileToRemove = uploadedFiles[index];
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    
    // Optionally delete from storage (commented out to avoid issues)
    // You might want to implement cleanup later
  };

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach((preview) => {
        if (preview.url.startsWith("blob:")) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, []);

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createReview({
          orderId,
          orderItemId,
          productId,
          sellerId,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim() || undefined,
          images: uploadedFiles.length > 0 ? uploadedFiles : undefined,
          isAnonymous,
        });

        if (result.success) {
          toast.success("Review submitted successfully! It will be visible after approval.");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to submit review");
        }
      } catch (error) {
        console.error("Error submitting review:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h4 className="font-semibold text-sm mb-3">Write a Review</h4>

      {/* Rating Stars */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 mb-2 block">Rating *</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none"
              disabled={isPending}
            >
              <Star
                className={`h-5 w-5 ${
                  star <= (hoverRating || rating)
                    ? "text-yellow-400 fill-current"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <Input
          placeholder="Review title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
          maxLength={100}
          className="text-sm"
        />
      </div>

      {/* Comment */}
      <div className="mb-3">
        <Textarea
          placeholder="Share your experience with this product..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isPending}
          className="min-h-24 text-sm"
          maxLength={1000}
        />
      </div>

      {/* File Upload Section */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 mb-2 block">
          Add Photos or Videos (Optional)
        </label>
        <div className="space-y-2">
          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending || isUploading || uploadedFiles.length >= 5}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm text-gray-600"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>
                  {uploadedFiles.length >= 5
                    ? "Maximum 5 files reached"
                    : "Upload Images or Videos"}
                </span>
              </>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isPending || isUploading || uploadedFiles.length >= 5}
          />

          {/* File Previews */}
          {filePreviews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {filePreviews.map((preview, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group"
                >
                  {preview.type === "image" ? (
                    <Image
                      src={preview.url}
                      alt={`Review image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <video
                      src={preview.url}
                      className="w-full h-full object-cover"
                      controls={false}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    disabled={isPending || isUploading}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                    aria-label="Remove file"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {preview.type === "video" && (
                    <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      <span>Video</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {uploadedFiles.length > 0 && (
            <p className="text-xs text-gray-500">
              {uploadedFiles.length} of 5 files uploaded
            </p>
          )}
        </div>
      </div>

      {/* Anonymous Checkbox */}
      <div className="flex items-center gap-2 mb-3">
        <Checkbox
          id={`anonymous-${orderItemId}`}
          checked={isAnonymous}
          onCheckedChange={(checked) => setIsAnonymous(checked === true)}
          disabled={isPending}
        />
        <label
          htmlFor={`anonymous-${orderItemId}`}
          className="text-xs text-gray-600 cursor-pointer"
        >
          Post as anonymous
        </label>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isPending || rating === 0}
        size="sm"
        className="w-full"
      >
        {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {isPending ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  );
}
