"use client";

import React, { useRef, useTransition } from "react";
import { Camera, Loader2, Pen } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { UserAvatar, type UserAvatarSize } from "@/components/shared/user-avatar";
import { uploadAvatar, updateUserProfile } from "@/actions/auth";
import { notifyAuthChanged } from "@/lib/auth/use-auth-user";
import { useRouter } from "@/i18n/navigation";
import type { AvatarSubject } from "@/lib/auth/avatar";
import { cn } from "@/lib/utils";

interface AvatarUploaderProps {
  user: AvatarSubject | null;
  size?: UserAvatarSize;
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
  const router = useRouter();
  const tToast = useTranslations("toast");

  const handleAvatarClick = () => {
    if (isPending) return;
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error(tToast("pleaseSelectImageFile"));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(tToast("fileSizeMustBeLessThan5MB"));
      return;
    }

    startTransition(async () => {
      try {
        // Upload file to Supabase Storage
        const uploadResult = await uploadAvatar(file);
        if (!uploadResult.success) {
          toast.error(uploadResult.error || tToast("failedToUploadAvatar"));
          return;
        }

        const avatarUrl = uploadResult.data?.url || "";
        if (!avatarUrl) {
          toast.error(tToast("failedToGetAvatarUrl"));
          return;
        }

        // Update user profile with new avatar URL
        const updateResult = await updateUserProfile({
          avatar_url: avatarUrl,
        });

        if (updateResult.success) {
          toast.success(tToast("avatarUpdatedSuccessfully"));

          // The new avatar lives in cookies-backed auth metadata and the users
          // table, so nothing client-side observes it on its own. Re-read the
          // shared viewer (updates the navbar avatar immediately) and refetch
          // the server-rendered profile page beneath it. The previous
          // invalidateQueries call targeted a ["user"] key no query uses, so
          // the navbar kept the old avatar until a hard reload.
          notifyAuthChanged();
          router.refresh();
        } else {
          toast.error(updateResult.error || tToast("failedToUpdateAvatar"));
        }
      } catch (error) {
        console.error("Error updating avatar:", error);
        toast.error(tToast("somethingWentWrong"));
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
      <div onClick={handleAvatarClick} className="relative">
        <UserAvatar user={user} size={size} />
        {showEditIcon && (
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}
        {/* Small pen icon in bottom right to indicate editability */}
        <div className="absolute -bottom-0.5 -right-0.5 z-20 pointer-events-none">
          <span className="flex size-5.5 items-center justify-center bg-primary rounded-full shadow-sm">
            {isPending ? (
              <Loader2 className="size-2.5 text-white animate-spin" />
            ) : (
              <Pen className=" size-2.5 text-white" />
            )}
          </span>
        </div>
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
