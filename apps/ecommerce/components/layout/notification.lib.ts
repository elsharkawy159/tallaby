/**
 * Utility functions for notification components
 */

/**
 * Format timestamp to human-readable relative time
 * Examples: "2 minutes ago", "3 hours ago", "Yesterday", "2 days ago"
 */
export function formatNotificationTime(
  dateString: string | null | undefined
): string {
  if (!dateString) return "Just now";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return "Just now";
    if (diffMinutes < 60)
      return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
    if (diffHours < 24)
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? "month" : "months"} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  } catch {
    return "Recently";
  }
}

/**
 * Format badge count display
 * Caps at 99 and shows "99+" for larger numbers
 */
export function formatBadgeCount(count: number): string {
  if (count <= 0) return "0";
  if (count > 99) return "99+";
  return count.toString();
}

/**
 * Get notification type icon name or color
 * Can be extended for icon mapping
 */
export function getNotificationTypeColor(type: string): string {
  const typeColors: Record<string, string> = {
    order_update: "text-blue-600",
    shipment_update: "text-purple-600",
    price_drop: "text-green-600",
    review_response: "text-amber-600",
    marketing: "text-pink-600",
  };
  return typeColors[type] ?? "text-gray-600";
}
