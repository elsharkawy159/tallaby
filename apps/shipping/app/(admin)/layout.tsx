import { redirect } from "next/navigation";

import { getShippingUser } from "@/lib/auth";
import { Header } from "./_components/layout/header";
import { MobileNav } from "./_components/layout/mobile-nav";
import { Sidebar } from "./_components/layout/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The proxy already gates this, but the layout re-checks: the proxy protects
  // navigation, not a direct request, and this is where the identity shown in
  // the header comes from anyway.
  const user = await getShippingUser();

  if (!user) redirect("/login");
  if (user.role === "driver") redirect("/rider");
  if (user.role !== "admin" || !user.isVerified || user.isSuspended) {
    redirect("/login?error=forbidden");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header name={user.fullName ?? "Admin"} email={user.email ?? ""} />
        <main className="flex-1 bg-gray-50 p-4 pb-20 md:p-6 md:pb-6 dark:bg-gray-900">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
