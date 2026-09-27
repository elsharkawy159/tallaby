"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores";

interface MainContentWrapperProps {
  children: React.ReactNode;
}

export function MainContentWrapper({ children }: MainContentWrapperProps) {
  const { isCollapsed, setMobileOpen } = useSidebarStore();
  const t = useTranslations("nav");

  return (
    // min-w-0 lets wide content (tables) scroll inside the page instead of
    // stretching it past the viewport.
    <div
      className={cn(
        "min-w-0 flex-1 transition-all duration-300 ease-in-out",
        isCollapsed ? "lg:ms-20" : "lg:ms-[280px]"
      )}
    >
      {/* Mobile / tablet top bar — the sidebar is a drawer below lg */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-gray-200 bg-white px-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 text-gray-700"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="size-5" />
          <span className="sr-only">{t("openMenu")}</span>
        </Button>
        <Link href="/" className="flex shrink-0" aria-label="Tallaby">
          <Image
            src="/logo-word.png"
            alt="Tallaby"
            width={100}
            height={28}
            className="object-contain object-left rtl:object-right"
          />
        </Link>
      </div>
      {children}
    </div>
  );
}
