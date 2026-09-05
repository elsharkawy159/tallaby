"use client";

import { ReactNode } from "react";
import Sidebar from "@/app/(dashboard)/_components/layout/sidebar";
import Header from "@/app/(dashboard)/_components/layout/header";
import { EMPTY_SIDEBAR_COUNTS } from "@/app/(dashboard)/_components/layout/sidebar.types";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar counts={EMPTY_SIDEBAR_COUNTS} />
      <div className="lg:pl-64">
        <Header />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
