    
// apps/ecommerce/actions/customer.ts
"use server";

import { db, users, userAddresses, paymentMethods, notifications, orders, eq, and, desc } from "@workspace/db";
import { getUser } from "./auth";

export async function getCustomerProfile() {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const profile = await db.query.users.findFirst({
      where: eq(users.id, user.user.id),
      with: {
        userAddresses: {
          orderBy: [desc(userAddresses.isDefault)],
        },
        paymentMethods: {
          orderBy: [desc(paymentMethods.isDefault)],
        },
        orders: {
          limit: 5,
          orderBy: [desc(orders.createdAt)],
        },
        wishlists: {
          limit: 3,
        },
      },
    });

    return { success: true, data: profile };
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { success: false, error: "Failed to fetch profile" };
  }
}

export async function addAddress(data: {
  addressType?: 'shipping' | 'billing' | 'both';
  fullName: string;
  phone: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
  deliveryInstructions?: string;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db
        .update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, user.user.id));
    }

    const [newAddress] = await db
      .insert(userAddresses)
      .values({
        ...data,
        userId: user.user.id,
        addressType: data.addressType || 'both',
        isDefault: data.isDefault || false,
      })
      .returning();

    return { success: true, data: newAddress };
  } catch (error) {
    console.error("Error adding address:", error);
    return { success: false, error: "Failed to add address" };
  }
}

export async function updateAddress(addressId: string, data: Partial<typeof userAddresses.$inferInsert>) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db
        .update(userAddresses)
        .set({ isDefault: false })
        .where(eq(userAddresses.userId, user.user.id));
    }

    const [updated] = await db
      .update(userAddresses)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(and(
        eq(userAddresses.id, addressId),
        eq(userAddresses.userId, user.user.id)
      ))
      .returning();

    if (!updated) {
      return { success: false, error: "Address not found" };
    }

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating address:", error);
    return { success: false, error: "Failed to update address" };
  }
}

export async function deleteAddress(addressId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    await db
      .delete(userAddresses)
      .where(and(
        eq(userAddresses.id, addressId),
        eq(userAddresses.userId, user.user.id)
      ));

    return { success: true, message: "Address deleted" };
  } catch (error) {
    console.error("Error deleting address:", error);
    return { success: false, error: "Failed to delete address" };
  }
}

export async function getAddresses() {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const addresses = await db.query.userAddresses.findMany({
      where: eq(userAddresses.userId, user.user.id),
      orderBy: [desc(userAddresses.isDefault), desc(userAddresses.createdAt)],
    });

    return { success: true, data: addresses };
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return { success: false, error: "Failed to fetch addresses" };
  }
}

export async function addPaymentMethod(data: {
  type: 'card' | 'wallet' | 'bank';
  provider?: string;
  paymentData?: any;
  nickname?: string;
  last4?: string;
  expiryMonth?: string;
  expiryYear?: string;
  isDefault?: boolean;
  billingAddressId?: string;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db
        .update(paymentMethods)
        .set({ isDefault: false })
        .where(eq(paymentMethods.userId, user.user.id));
    }

    const [newMethod] = await db
      .insert(paymentMethods)
      .values({
        ...data,
        userId: user.user.id,
        isDefault: data.isDefault || false,
      })
      .returning();

    return { success: true, data: newMethod };
  } catch (error) {
    console.error("Error adding payment method:", error);
    return { success: false, error: "Failed to add payment method" };
  }
}

export async function getNotifications() {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const userNotifications = await db.query.notifications.findMany({
      where: eq(notifications.userId, user.user.id),
      orderBy: [desc(notifications.createdAt)],
      limit: 50,
    });

    return { success: true, data: userNotifications };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { success: false, error: "Failed to fetch notifications" };
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    await db
      .update(notifications)
      .set({
        isRead: true,
        readAt: new Date().toISOString(),
      })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, user.user.id)
      ));

    return { success: true };
  } catch (error) {
    console.error("Error marking notification read:", error);
    return { success: false, error: "Failed to update notification" };
  }
}

export async function updatePreferences(data: {
  receiveMarketingEmails?: boolean;
  preferredLanguage?: string;
  defaultCurrency?: string;
}) {
  try {
    const user = await getUser();
    if (!user) {
      return { success: false, error: "Authentication required" };
    }

    const [updated] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.user.id))
      .returning();

    return { success: true, data: updated };
  } catch (error) {
    console.error("Error updating preferences:", error);
    return { success: false, error: "Failed to update preferences" };
  }
}