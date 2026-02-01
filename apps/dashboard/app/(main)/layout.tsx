import { Sidebar } from "@/components/dashboard/Sidebar";
// import { Navbar } from "@/components/layout/Navbar";
import { MainContentWrapper } from "@/components/layout/main-content-wrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      {/* Main Content Area */}
      <MainContentWrapper>
        {/* <Navbar /> */}

        <main>{children}</main>
      </MainContentWrapper>
    </div>
  );
}
