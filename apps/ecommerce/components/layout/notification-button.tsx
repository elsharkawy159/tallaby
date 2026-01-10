import { Suspense } from "react";
import { NotificationDropdownClient } from "./notification-dropdown.client";
import { NotificationCount } from "./notification-count";
import { getUnreadNotificationCount } from "@/actions/notifications";

/**
 * Server Component wrapper for notification button
 * Fetches initial unread count and passes to client component
 * Renders badge count via Suspense boundary
 *
 * Note: The badge is positioned absolutely and requires the button
 * to have 'relative' class, which is set in NotificationDropdownClient
 */
export async function NotificationButton() {
  // Fetch initial unread count server-side
  const countResult = await getUnreadNotificationCount();
  const initialUnreadCount = countResult.success
    ? (countResult.data?.count ?? 0)
    : 0;

  return (
    <div className="relative">
      <NotificationDropdownClient initialUnreadCount={initialUnreadCount} />
      <Suspense fallback={null}>
        <NotificationCount />
      </Suspense>
    </div>
  );
}
