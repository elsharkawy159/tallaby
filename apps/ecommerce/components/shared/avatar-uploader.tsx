"use client";

import React, { useRef, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { UserAvatar } from "@/components/shared/user-avatar";
import { uploadAvatar, updateUserProfile } from "@/actions/auth";
import { cn } from "@/lib/utils";

interface AvatarUploaderProps {
  user: any;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showEditIcon?: boolean;
}

export function AvatarUploader({
  user,
  size = "xl",
  className,
  showEditIcon = true,
}: AvatarUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const handleAvatarClick = () => {
    if (isPending) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    startTransition(async () => {
      try {
        // Upload file to Supabase Storage
        const uploadResult = await uploadAvatar(file);
        if (!uploadResult.success) {
          toast.error(uploadResult.error || "Failed to upload avatar");
          return;
        }

        const avatarUrl = uploadResult.data?.url || "";
        if (!avatarUrl) {
          toast.error("Failed to get avatar URL");
          return;
        }

        // Update user profile with new avatar URL
        const updateResult = await updateUserProfile({
          avatar_url: avatarUrl,
        });

        if (updateResult.success) {
          toast.success("Avatar updated successfully");

          // Invalidate user queries to refresh data
          await queryClient.invalidateQueries({
            queryKey: ["user"],
            refetchType: "active",
          });
        } else {
          toast.error(updateResult.error || "Failed to update avatar");
        }
      } catch (error) {
        console.error("Error updating avatar:", error);
        toast.error("Something went wrong. Please try again.");
      } finally {
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    });
  };

  return (
    <div className={cn("relative group cursor-pointer", className)}>
      <div onClick={handleAvatarClick}>
        <UserAvatar user={user} size={size} />
        {showEditIcon && (
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            {isPending ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isPending}
      />
    </div>
  );
}
