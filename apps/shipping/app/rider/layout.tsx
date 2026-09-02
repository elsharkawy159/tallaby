import { redirect } from "next/navigation";

import { LanguageSwitcher } from "@/components/language-switcher";
import { getShippingUser } from "@/lib/auth";
import { RiderAvailabilityToggle } from "./_components/rider-availability-toggle";
import { RiderLogo } from "./_components/rider-logo";
import { RiderRealtime } from "./_components/rider-realtime";
import { RiderUserMenu } from "./_components/rider-user-menu";

export default async function RiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getShippingUser();

  if (!user) redirect("/login");
  if (user.isSuspended) redirect("/login?error=forbidden");
  if (user.role !== "driver") redirect("/");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* The rider id comes from the session above, never from the client. */}
      <RiderRealtime riderId={user.id} />
      <header className="sticky top-0 z-40 border-b border-border bg-white dark:bg-gray-950">
        <div className="relative mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <RiderLogo />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <RiderAvailabilityToggle isAvailable={user.isAvailable} />
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher variant="icon-popover" />
            <RiderUserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-md p-4">{children}</main>
    </div>
  );
}
