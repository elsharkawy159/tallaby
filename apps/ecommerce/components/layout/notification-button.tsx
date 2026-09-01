"use client";

import { Suspense, useEffect, useState } from "react";
import { NotificationDropdownClient } from "./notification-dropdown.client";
import { getUnreadNotificationCount } from "@/actions/notifications";
import { useAuthUser } from "@/lib/auth/use-auth-user";

export function NotificationButton() {
  const { user } = useAuthUser();
  const [initialUnreadCount, setInitialUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setInitialUnreadCount(0);
      return;
    }

    getUnreadNotificationCount().then((countResult) => {
      setInitialUnreadCount(
        countResult.success ? (countResult.data?.count ?? 0) : 0
      );
    });
  }, [user]);

  if (!user) return null;

  return (
    <div className="relative">
      <NotificationDropdownClient initialUnreadCount={initialUnreadCount} />
      <Suspense fallback={null}>
        <NotificationCountClient />
      </Suspense>
    </div>
  );
}

function NotificationCountClient() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getUnreadNotificationCount().then((result) => {
      setCount(result.success ? (result.data?.count ?? 0) : 0);
    });
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full size-5 flex items-center justify-center font-medium">
      {count > 99 ? "99+" : count}
    </span>
  );
}
