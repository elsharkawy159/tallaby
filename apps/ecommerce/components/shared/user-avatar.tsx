"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { cn } from "@/lib/utils";
import {
  getAvatarInitials,
  getAvatarPresentation,
  type AvatarSubject,
} from "@/lib/auth/avatar";

export type UserAvatarSize = "sm" | "md" | "lg" | "xl";

interface UserAvatarProps {
  user: AvatarSubject | null;
  className?: string;
  size?: UserAvatarSize;
  showFallback?: boolean;
  /** Overrides the derived accessible name (e.g. "Your profile picture"). */
  alt?: string;
  /** Extra classes for the initials fallback, e.g. responsive text sizing. */
  fallbackClassName?: string;
}

const sizeClasses: Record<UserAvatarSize, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
  xl: "size-16",
};

const fallbackTextClasses: Record<UserAvatarSize, string> = {
  sm: "text-[10px]",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
};

/**
 * The one avatar component in the app.
 *
 * Radix's AvatarImage only reveals itself once the image actually loads, so a
 * broken or slow URL falls through to the initials rather than showing a torn
 * image — which is why the fallback is always rendered rather than being
 * conditional on `src` being present. The fixed size classes mean the circle
 * occupies its final box before the image arrives, so no layout shift.
 */
export function UserAvatar({
  user,
  className,
  size = "md",
  showFallback = true,
  alt,
  fallbackClassName,
}: UserAvatarProps) {
  const { src, initials, alt: derivedAlt } = getAvatarPresentation(user);

  return (
    <Avatar className={cn(sizeClasses[size], "shrink-0", className)}>
      <AvatarImage src={src ?? undefined} alt={alt ?? derivedAlt} />
      {showFallback && (
        <AvatarFallback
          className={cn(
            "bg-primary text-primary-foreground font-medium",
            fallbackTextClasses[size],
            fallbackClassName
          )}
        >
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

/** Initials-only variant, for places that must never show a photo. */
export function UserInitialsAvatar({
  user,
  className,
  size = "md",
}: Omit<UserAvatarProps, "showFallback" | "alt">) {
  return (
    <Avatar className={cn(sizeClasses[size], "shrink-0", className)}>
      <AvatarFallback
        className={cn(
          "bg-primary text-primary-foreground font-medium",
          fallbackTextClasses[size]
        )}
      >
        {getAvatarInitials(user)}
      </AvatarFallback>
    </Avatar>
  );
}
