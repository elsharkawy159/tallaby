import { ReactNode } from "react";
import Sidebar from "./_components/layout/sidebar";
import Header from "./_components/layout/header";
import { ScrollArea } from "@workspace/ui/components/scroll-area";

interface DashboardShellProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardShellProps) {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 h-screen overflow-hidden">
        <Header />
        <ScrollArea className="h-[calc(100vh-64px)]">
          <main className="bg-gray-50 dark:bg-gray-900 p-4 md:p-6 min-h-[calc(100vh-65px)]">
            {children}
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}
