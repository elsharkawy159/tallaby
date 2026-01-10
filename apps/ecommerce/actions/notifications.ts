"use server";

import { db, notifications, eq, and, desc, sql } from "@workspace/db";
import { getUser } from "./auth";

/**
 * Fetch user notifications with optional filtering
 * Returns notifications ordered by newest first, with unread count
 */
export async function getNotifications(params?: {
  type?: string;
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    const user = await getUser();
    if (!user?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    const userId = user.user.id;
    const conditions = [eq(notifications.userId, userId)];

    if (params?.type) {
      conditions.push(eq(notifications.type, params.type as any));
    }

    if (params?.unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    // Fetch notifications ordered by newest first
    const userNotifications = await db.query.notifications.findMany({
      where: and(...conditions),
      orderBy: [desc(notifications.createdAt)],
      limit: params?.limit ?? 20,
      offset: params?.offset ?? 0,
    });

    // Get unread count efficiently
    const unreadCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), eq(notifications.isRead, false))
      );

    const unreadCount = Number(unreadCountResult[0]?.count ?? 0);

    return {
      success: true,
      data: {
        notifications: userNotifications,
        unreadCount,
      },
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

/**
 * Get only the unread notification count for badge display
 * More efficient than fetching all notifications when only count is needed
 */
export async function getUnreadNotificationCount() {
  try {
    const user = await getUser();
    if (!user?.user?.id) {
      return { success: true, data: { count: 0 } };
    }

    const unreadCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, user.user.id),
          eq(notifications.isRead, false)
        )
      );

    const count = Number(unreadCountResult[0]?.count ?? 0);

    return { success: true, data: { count } };
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return { success: true, data: { count: 0 } }; // Fail gracefully
  }
}

/**
 * Mark a single notification as read
 * Updates isRead flag and sets readAt timestamp
 */
export async function markNotificationRead(notificationId: string) {
  try {
    const user = await getUser();
    if (!user?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, user.user.id)
        )
      );

    return { success: true };
  } catch (error) {
    console.error("Error marking notification read:", error);
    return { success: false, error: "Failed to update notification" };
  }
}

/**
 * Mark all user notifications as read
 * Useful for "Mark all as read" button in dropdown
 */
export async function markAllNotificationsRead() {
  try {
    const user = await getUser();
    if (!user?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(notifications.userId, user.user.id),
          eq(notifications.isRead, false)
        )
      );

    return { success: true, message: "All notifications marked as read" };
  } catch (error) {
    console.error("Error marking all notifications read:", error);
    return { success: false, error: "Failed to update notifications" };
  }
}

/**
 * Delete a notification (optional feature)
 */
export async function deleteNotification(notificationId: string) {
  try {
    const user = await getUser();
    if (!user?.user?.id) {
      return { success: false, error: "Authentication required" };
    }

    await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, user.user.id)
        )
      );

    return { success: true, message: "Notification deleted" };
  } catch (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: "Failed to delete notification" };
  }
}

export async function createNotification(data: {
  userId: string;
  type:
    | "order_update"
    | "shipment_update"
    | "price_drop"
    | "review_response"
    | "marketing";
  title: string;
  message: string;
  data?: any;
}) {
  try {
    const [newNotification] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
      })
      .returning();

    return { success: true, data: newNotification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: "Failed to create notification" };
  }
}

export async function subscribeToProductAlerts(productId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // This would typically store subscription in a separate table
    // For now, we'll just return success
    // You might want to create a product_alerts table

    return {
      success: true,
      message: "Subscribed to product alerts",
    };
  } catch (error) {
    console.error("Error subscribing to alerts:", error);
    return { success: false, error: "Failed to subscribe" };
  }
}
