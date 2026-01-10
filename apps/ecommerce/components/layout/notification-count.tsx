import { getUnreadNotificationCount } from "@/actions/notifications";

/**
 * Server Component that displays unread notification count badge
 * Fetches count server-side for better performance
 * Returns null if count is 0 (no badge shown)
 */
export const NotificationCount = async () => {
  const result = await getUnreadNotificationCount();
  const count = result.success ? (result.data?.count ?? 0) : 0;

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center font-medium">
      {count > 99 ? "99+" : count}
    </span>
  );
};
