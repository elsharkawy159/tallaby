import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Truck } from "lucide-react";

import { getShippingUser } from "@/lib/auth";
import { RiderSignOut } from "./_components/rider-sign-out";

export default async function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getShippingUser();
  const t = await getTranslations("rider");

  if (!user) redirect("/login");
  if (user.isSuspended) redirect("/login?error=forbidden");
  if (user.role !== "driver") redirect("/");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-40 border-b border-border bg-white dark:bg-gray-950">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Truck className="size-3.5" />
            </div>
            <span className="truncate text-sm font-semibold">
              {user.fullName ?? t("myDeliveries")}
            </span>
          </div>
          <RiderSignOut />
        </div>
      </header>
      <main className="mx-auto max-w-md p-4">{children}</main>
    </div>
  );
}
