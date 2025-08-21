import { Sidebar } from "@/components/dashboard/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 transition-all duration-300 ease-in-out lg:ml-20 xl:ml-72">
        <Navbar />

        <div className="pt-[73px]">{children}</div>
      </main>
    </div>
  );
}
