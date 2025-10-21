"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import {
  getUserAvatar,
  getUserInitials,
  getAvatarWithFallback,
} from "@/app/(main)/profile/_components/profile.lib";
import type { SupabaseUser } from "@/app/(main)/profile/_components/profile.types";

interface UserAvatarProps {
  user: SupabaseUser | any;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showFallback?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export function UserAvatar({
  user,
  className = "",
  size = "md",
  showFallback = true,
}: UserAvatarProps) {
  const avatarData = getAvatarWithFallback(user);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={avatarData.src || undefined} alt={avatarData.alt} />
      {showFallback && (
        <AvatarFallback className="text-sm font-medium">
          {avatarData.fallback}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

// Simple avatar with just initials fallback
export function UserInitialsAvatar({
  user,
  className = "",
  size = "md",
}: Omit<UserAvatarProps, "showFallback">) {
  const initials = getUserInitials(user);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarFallback className="text-sm font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

// Avatar with image only (no fallback)
export function UserImageAvatar({
  user,
  className = "",
  size = "md",
}: Omit<UserAvatarProps, "showFallback">) {
  const avatar = getUserAvatar(user);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={avatar || undefined} alt="User Avatar" />
    </Avatar>
  );
}
