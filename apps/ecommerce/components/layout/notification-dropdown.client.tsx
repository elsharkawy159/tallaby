"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { Button } from "@workspace/ui/components/button";
import { Separator } from "@workspace/ui/components/separator";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { cn } from "@/lib/utils";
import { formatNotificationTime } from "./notification.lib";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/actions/notifications";

/**
 * Notification type from database
 * Matches the notifications table schema
 * href is stored in data.href
 */
interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data: {
    href?: string;
    [key: string]: any;
  } | null;
  isRead: boolean | null;
  readAt: string | null;
  createdAt: string | null;
}

interface NotificationDropdownClientProps {
  initialUnreadCount?: number;
}

/**
 * Client component for notification dropdown
 * Handles fetching, displaying, and marking notifications as read
 */
export function NotificationDropdownClient({
  initialUnreadCount = 0,
}: NotificationDropdownClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Fetch notifications using useQuery - only when dropdown is open
  const {
    data: notificationsData,
    isLoading,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const result = await getNotifications({ limit: 20 });
      if (result.success && result.data) {
        return result.data;
      }
      return { notifications: [], unreadCount: 0 };
    },
    enabled: isOpen, // Only fetch when dropdown is open
    staleTime: 0, // Always consider data stale to get fresh notifications
    gcTime: 0, // Don't cache in memory
  });

  const notifications = (notificationsData?.notifications ??
    []) as Notification[];
  const unreadCount = notificationsData?.unreadCount ?? initialUnreadCount;

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead || notification.isRead === null) {
      setIsMarkingRead(notification.id);
      try {
        await markNotificationRead(notification.id);
        // Invalidate and refetch notifications to get updated data
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch (error) {
        console.error("Error marking notification as read:", error);
      } finally {
        setIsMarkingRead(null);
      }
    }

    // Close dropdown after navigation (Link handles navigation for notifications with href)
    if (notification.data?.href) {
      setIsOpen(false);
    }
  };

  const handleMarkAllRead = async () => {
    setIsMarkingRead("all");
    try {
      const result = await markAllNotificationsRead();
      if (result.success) {
        // Invalidate and refetch notifications to get updated data
        await queryClient.invalidateQueries({ queryKey: ["notifications"] });
        // Note: Badge count (Server Component) will update on next page render/navigation
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setIsMarkingRead(null);
    }
  };

  const hasUnread = unreadCount > 0;
  const unreadNotifications = notifications.filter(
    (n) => !n.isRead || n.isRead === null
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative flex flex-col items-center text-white hover:text-gray-200"
          )}
          aria-label="Notifications"
        >
          <Bell className="md:size-6 size-5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleMarkAllRead}
              disabled={isMarkingRead === "all"}
            >
              {isMarkingRead === "all" ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <>
                  <CheckCheck className="size-3 mr-1" />
                  Mark all read
                </>
              )}
            </Button>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Bell className="size-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="divide-y p-2 space-y-2">
              {notifications.map((notification) => {
                const isUnread =
                  !notification.isRead || notification.isRead === null;
                const isMarking = isMarkingRead === notification.id;
                const href = notification.data?.href;
                const hasHref = !!href;

                // Common content for both Link and button
                const notificationContent = (
                  <div className="flex items-start gap-3">
                    {/* Unread indicator */}
                    {isUnread && (
                      <div className="size-2 absolute top-2 right-2 opacity-80 rounded-full bg-primary shrink-0" />
                    )}

                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <p
                        className={cn(
                          "text-sm font-medium",
                          isUnread ? "text-foreground" : "text-primary"
                        )}
                      >
                        {notification.title}
                      </p>

                      {/* Message */}
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>

                      {/* Time */}
                      <p className="text-[10px] text-right text-muted-foreground mt-1">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                );

                // Render as Link if href exists, otherwise as button
                if (hasHref && href) {
                  return (
                    <Link
                      key={notification.id}
                      href={href}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "block w-full text-left p-2.5 relative ring ring-gray-300 rounded-lg hover:bg-accent/20 transition-colors",
                        isUnread && "bg-accent/40 ring-accent"
                      )}
                    >
                      {notificationContent}
                    </Link>
                  );
                }

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    disabled={isMarking}
                    className={cn(
                      "w-full text-left p-2.5 relative ring ring-gray-300 rounded-lg hover:bg-accent/20 transition-colors",
                      isUnread && "bg-accent/40 ring-accent"
                    )}
                  >
                    {notificationContent}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer - View all link */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-center text-xs"
                asChild
              >
                <Link
                  href="/profile/notifications"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
