"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { UserAvatar } from "./user-avatar";
import {
  formatUserName,
  getUserAvatar,
  getUserInitials,
} from "@/app/(main)/profile/_components/profile.lib";
import type { SupabaseUser } from "@/app/(main)/profile/_components/profile.types";

interface UserProfileDemoProps {
  user: SupabaseUser | any;
  title?: string;
}

export function UserProfileDemo({
  user,
  title = "User Profile Demo",
}: UserProfileDemoProps) {
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No user data available</p>
        </CardContent>
      </Card>
    );
  }

  const avatar = getUserAvatar(user);
  const initials = getUserInitials(user);
  const name = formatUserName(user);
  const isVerified =
    user?.email_confirmed_at ||
    user?.user_metadata?.email_verified ||
    user?.isVerified;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar Display */}
        <div className="flex items-center space-x-4">
          <UserAvatar user={user} size="xl" />
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {isVerified && (
              <span className="inline-flex items-center text-xs text-green-600">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2.5l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 14.27l-4.77 2.51.91-5.32-3.87-3.77 5.34-.78L10 2.5z" />
                </svg>
                Verified
              </span>
            )}
          </div>
        </div>

        {/* User Data Debug Info */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Debug Information:</h4>
          <div className="text-xs space-y-1 bg-gray-50 p-3 rounded">
            <div>
              <strong>Avatar URL:</strong> {avatar || "None"}
            </div>
            <div>
              <strong>Initials:</strong> {initials}
            </div>
            <div>
              <strong>Full Name:</strong> {name}
            </div>
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>Verified:</strong> {isVerified ? "Yes" : "No"}
            </div>

            {/* Show metadata if available */}
            {user.user_metadata && (
              <div className="mt-2 pt-2 border-t">
                <strong>Metadata:</strong>
                <pre className="text-xs mt-1 overflow-auto">
                  {JSON.stringify(user.user_metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Different Avatar Sizes */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Avatar Sizes:</h4>
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <UserAvatar user={user} size="sm" />
              <p className="text-xs mt-1">Small</p>
            </div>
            <div className="text-center">
              <UserAvatar user={user} size="md" />
              <p className="text-xs mt-1">Medium</p>
            </div>
            <div className="text-center">
              <UserAvatar user={user} size="lg" />
              <p className="text-xs mt-1">Large</p>
            </div>
            <div className="text-center">
              <UserAvatar user={user} size="xl" />
              <p className="text-xs mt-1">Extra Large</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
